import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import Nightmare from 'nightmare';
import inquirer from 'inquirer';

const quotesFilename = 'quotes.json';
const quotesFilePath = path.resolve('./json/' + quotesFilename);

let quotes = [];

const reviewedQuotesFilename = 'reviewed-quotes.json';
const reviewedQuotesFilePath = path.resolve('./json/' + reviewedQuotesFilename);

let reviewedQuotes = [];

const loadQuotesFromFile = () => {
  return new Promise((res, rej) => {
    fs.exists(quotesFilePath, (exists) => {
      if (exists) {
        fs.readFile(quotesFilePath, 'utf8', (err, data) => {
          if (err) {
            rej(err);
            return;
          }

          quotes = JSON.parse(data);
          res(quotes);
        });
      } else {
        res(quotes);
      }
    });
  });
};

const writeQuotesToFile = (quotesToWrite) => {
  return new Promise((res, rej) => {
    fs.writeFile(quotesFilePath, JSON.stringify(quotesToWrite, null, 2), 'utf8', (err) => {
      if (err) {
        console.log(err.message);
        rej(err);
        return;
      }

      quotes = quotesToWrite;
      res();
    });
  });
};

const loadReviewedQuotesFromFile = () => {
  return new Promise((res, rej) => {
    fs.exists(reviewedQuotesFilePath, (exists) => {
      if (exists) {
        fs.readFile(reviewedQuotesFilePath, 'utf8', (err, data) => {
          if (err) {
            rej(err);
            return;
          }

          reviewedQuotes = JSON.parse(data);
          res(reviewedQuotes);
        });
      } else {
        res(reviewedQuotes);
      }
    });
  });
};

const writeReviewedQuotesToFile = (reviewedQuotesToWrite) => {
  return new Promise((res, rej) => {
    fs.writeFile(reviewedQuotesFilePath, JSON.stringify(reviewedQuotesToWrite, null, 2), 'utf8', (err) => {
      if (err) {
        console.log(err.message);
        rej(err);
        return;
      }

      reviewedQuotes = reviewedQuotesToWrite;
      res();
    });
  });
};

const nm = Nightmare({
  show: true,
  openDevTools: {
    mode: 'detach',
  },
});

const LIMIT = 50;

nm.goto('https://www.brainyquote.com/')
  .viewport(1500, 1024)
  .wait('#quotesList')
  .wait(1000)
  .scrollTo(3000, 0)
  .wait(1000)
  .scrollTo(6000, 0)
  .wait(1000)
  .scrollTo(9000, 0)
  .wait(1000)
  .evaluate((LIMIT) => {
    return new Promise((res, rej) => {
      $.getScript('https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js', function() {
        const allTxt = {};

        document.querySelectorAll('#quotesList > div > div > div:first-child > div').forEach((el, i) => {
          if (i >= LIMIT) {
            return;
          }

          const txt = el.querySelector(':scope > a');
          const author = el.querySelector(':scope > div:last-child > a');

          if (txt && author && txt.innerText.trim() && author.innerText.trim()) {
            const key = _.kebabCase(`${txt.innerText.substring(0, 20)} ${author.innerText}`);

            allTxt[key] = {
              text: txt.innerText.trim(),
              author: author.innerText.trim(),
            };
          }
        });

        res(allTxt);
      });
    });
  }, LIMIT)
  .end()
  .then((quotesNew) => {
    if (quotesNew) {
      loadQuotesFromFile().then((loadedQuotes) => {
        const allQuotes = (_.isObject(loadedQuotes) && !_.isArray(loadedQuotes)) ? _.cloneDeep(loadedQuotes) : {};

        loadReviewedQuotesFromFile().then((loadedReviewedQuotes) => {
          const allReviewedQuotes = (_.isObject(loadedReviewedQuotes) && !_.isArray(loadedReviewedQuotes)) ? _.cloneDeep(loadedReviewedQuotes) : {};
          const questions = [];
          let i = 0;

          Object.keys(quotesNew).forEach((k) => {
            const q = quotesNew[k];

            if (!loadedReviewedQuotes[k]) {
              i = i + 1;

              questions.push({
                type: 'confirm',
                name: k,
                message: `${i}. "${q.text}" --${q.author} ... keep this quote?`,
                default: false,
              });
            }
          });

          console.log(`${questions.length} new quotes to review.`);

          if (questions.length > 0) {
            inquirer.prompt(questions)
              .then((answers) => {
                Object.keys(answers).forEach((key) => {
                  if (answers[key]) {
                    allQuotes[key] = quotesNew[key];
                  }

                  allReviewedQuotes[key] = quotesNew[key];
                });

                console.log(`Keeping ${Object.keys(allQuotes).length - Object.keys(loadedQuotes).length} new quotes.`);

                writeQuotesToFile(allQuotes);
                writeReviewedQuotesToFile(allReviewedQuotes);
              });
          }
        });
      });
    } else {
      console.error('No quotes!');
    }
  })
  .catch(console.error);
