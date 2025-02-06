#! /usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import Mocha from 'mocha';
import os from 'node:os';

const options = {
  username: {
    type: 'string',
  },
  origin: {
    type: 'string',
  },
  'project-id': {
    type: 'string',
    default: '218',
  },
  'suite-id': {
    type: 'string',
    default: '76158',
  },
};

const { values } = parseArgs({
  options,
  strict: true,
});

const { username, origin, 'project-id': projectId, 'suite-id': suiteId } = values;

if (!username) {
  console.log('You must provide your TestRail username.');
  process.exit(1);
}

if (!origin) {
  console.log('You must provide the TestRail origin.');
  process.exit(1);
}

const apiKeyPath = `${os.homedir()}/.testrail_api_key`;
try {
  await access(apiKeyPath);
} catch (e) {
  console.log(`You need to create a file at ${apiKeyPath} with your TestRail API key.`);
  process.exit(1);
}

let apiKey;
try {
  apiKey = await readFile(apiKeyPath, 'utf8');
  apiKey = apiKey.trim();
} catch (e) {
  console.log('Something is wrong with your Testrail API key.')
  process.exit(1);
}

const getAutomationIds = async () => {
  const response = await fetch(
    `${origin}/index.php?/api/v2/get_cases/${projectId}&suite_id=${suiteId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${username}:${apiKey}`)}`
      }
    },
  );
  const data = await response.json();
  return data.cases.reduce((acc, testCase) => {
    if (!testCase.custom_automation_id) {
      return acc;
    }
    const split = testCase.custom_automation_id.split(':');
    if (split.length !== 2) {
      return acc;
    }
    acc.push(testCase.custom_automation_id);
    return acc;
  }, [])
};

(async () => {
  const automationIds = await getAutomationIds();

  const filePaths = automationIds.map(automationId => automationId.split(':')[0]);
  const set = new Set();
  while (filePaths.length > 0) {
    let filePath = filePaths.pop();
    const extension = filePath.split('.').pop();
    if (extension !== 'mjs') {
      filePath = `${filePath.split('.').slice(0, -1).join('.')}.mjs`;
    }
    try {
      await access(filePath);
      set.add(filePath);
    } catch (e) {
      console.log(`Could not find file ${filePath}`);
    }
  }

  const mocha = new Mocha();
  set.forEach(file => mocha.addFile(file));

  const testNames = automationIds.map(automationId => automationId.split(':')[1]);
  await mocha.grep(new RegExp(`(${testNames.join('|')})`));

  await mocha.loadFilesAsync();
  await mocha.run();
})();
