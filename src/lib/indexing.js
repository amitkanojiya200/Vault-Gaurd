// src/lib/indexing.js
import * as fsClient from './fsClient';
import sessionClient from './sessionClient'; // your existing session helper

export async function indexAllDrives(onStatus) {
    // onStatus(statusObj) optional callback to receive progress updates
    const token = await sessionClient.getSessionToken();
    if (!token) throw new Error('no session token');

    const jobId = await fsClient.indexAllDrivesStart(token);

    // immediate callback
    if (onStatus) onStatus({ jobId, state: 'started' });

    // Poll loop - stop when Finished or Failed
    // NOTE: pollIntervalMs can be tuned
    const pollIntervalMs = 1200;
    let lastState = null;

    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const status = await fsClient.getIndexStatus(jobId);

        // status is Option<IndexJobState> — translate into simpler shape
        // Example status may be { Running: { processed: 123, last_path: "C:\\foo" } }
        // or { Finished: { processed: 345 } } or { Failed: { message: "..." } }
        if (status == null) {
            if (onStatus) onStatus({ jobId, state: 'unknown' });
            break;
        }

        // detect variant
        if (status.Running) {
            const { processed, last_path } = status.Running;
            const stateObj = { jobId, state: 'running', processed, lastPath: last_path };
            if (JSON.stringify(stateObj) !== JSON.stringify(lastState)) {
                lastState = stateObj;
                if (onStatus) onStatus(stateObj);
            }
        } else if (status.Finished) {
            const { processed } = status.Finished;
            const stateObj = { jobId, state: 'finished', processed };
            if (onStatus) onStatus(stateObj);
            break;
        } else if (status.Failed) {
            const { message } = status.Failed;
            const stateObj = { jobId, state: 'failed', message };
            if (onStatus) onStatus(stateObj);
            break;
        } else {
            if (onStatus) onStatus({ jobId, state: 'unknown', raw: status });
            break;
        }

        // sleep
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    // When finished/failed, refresh file/drive summaries so UI shows updated data
    try {
        const filesPerDrive = await fsClient.getFilesPerDrive();
        const indexingByDrive = await fsClient.getIndexingByDriveAndType();
        return { jobId, filesPerDrive, indexingByDrive };
    } catch (e) {
        return { jobId, error: e.message || String(e) };
    }
}
