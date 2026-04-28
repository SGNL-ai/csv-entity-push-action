import * as core from '@actions/core';
import { ActionInputs } from './types';
import { runPush } from './push';
import { runValidate } from './validate';
import { runGenerateIds } from './generate-ids';

async function run(): Promise<void> {
  try {
    const mode = core.getInput('mode', { required: true });
    const csvDirectoryInput = core.getInput('csv-directory');
    const csvDirectory =
      csvDirectoryInput ||
      process.env.CSV_DIRECTORY ||
      'csv_files';

    const inputs: ActionInputs = {
      mode: mode as ActionInputs['mode'],
      csvDirectory,
      entityPushUrl: core.getInput('entity-push-url'),
      entityPushIss: core.getInput('entity-push-iss'),
      entityPushAud: core.getInput('entity-push-aud'),
      entityPushToken: core.getInput('entity-push-token'),
      beforeSha: core.getInput('before-sha'),
    };

    switch (inputs.mode) {
      case 'push': {
        const summary = await runPush(inputs);
        core.setOutput('events-sent', summary.totalEvents.toString());
        core.setOutput('events-failed', summary.failureCount.toString());
        break;
      }
      case 'validate': {
        const errors = await runValidate(inputs);
        core.setOutput('validation-errors', errors.length.toString());
        break;
      }
      case 'generate-ids': {
        const summary = await runGenerateIds(inputs);
        core.setOutput('ids-generated', summary.idsGenerated.toString());
        break;
      }
      default:
        core.setFailed(
          `Unknown mode: ${mode}. Must be 'push', 'validate', or 'generate-ids'.`
        );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
