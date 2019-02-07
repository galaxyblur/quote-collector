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

loadQuotesFromFile().then((loadedQuotes) => {
  const loadedLength = Object.keys(_.isObject(loadedQuotes) ? loadedQuotes : {}).length;
  console.log(`Found ${loadedLength} saved quotes.`);
});

loadReviewedQuotesFromFile().then((loadedReviewedQuotes) => {
  const loadedLength = Object.keys(_.isObject(loadedReviewedQuotes) ? loadedReviewedQuotes : {}).length;
  console.log(`Found ${loadedLength} total reviewed quotes.`);
});
