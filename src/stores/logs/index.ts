// node_modules
import { writable, readable, derived, get } from "svelte/store";
import type * as tauriFs from 'tauri/api/fs';
import { v4 as uuid } from 'uuid';
import { get as _get, assign } from 'lodash';

// libraries
import { _ } from '../../lib/utils';

// models
import { LogGroup, LogGroupInterface, LogGroupFileInterface, LogGroupFile, AnyObject } from '../../models';

// services
import {
  directoriesService,
  filesService,
  logsService
} from "../../services";

// store specific
import { cachedLogsStoreState, initialLogsStoreState } from "./state";
import { LOGS_STORE_KEY } from "./keys";
import { createLogsStoreActions } from "./actions";
import { createLogsStoreThunks } from "./thunks";



function createLogsStore() {
  // get persisted item
  const storedLogsStore = JSON.parse(sessionStorage.getItem(LOGS_STORE_KEY));
  // create writable
  const _logsStore = writable(assign({}, initialLogsStoreState, _.isObject(storedLogsStore) ? storedLogsStore : {}));
  _logsStore.subscribe(value => {
    sessionStorage.setItem(LOGS_STORE_KEY, JSON.stringify(cachedLogsStoreState(value)));
  });

  const _logStoreActions = createLogsStoreActions(_logsStore);
  const _logStoreThunks = createLogsStoreThunks(_logStoreActions);

  return {
    update: _logsStore.update,
    subscribe: _logsStore.subscribe,
    reset: () => _logsStore.set(initialLogsStoreState),
    ..._logStoreActions,
    ..._logStoreThunks,
    parseLogGroupFiles: async (logGroup: LogGroup) => {
      try {
        // create new instance of a
        // log group to use internally
        const newLogGroup = new LogGroup(logGroup);
        // read directory - we do this to
        // determine the file type of
        // each file passed in
        const readDirectory = await directoriesService.readDir(newLogGroup.directoryPath);
        console.log('newLogGroup=', newLogGroup)
        console.log('readDirectory=', readDirectory)
        // parse each log group file that was provided
        const parsedLogGroupFiles = await Promise.all(newLogGroup.files.map(async (file) => {
          // find the file in the read directory
          const foundReadDirectoryFile = readDirectory.find((readDirectoryFile) => {
            if (readDirectoryFile.name.endsWith('.gz')) {
              const splitDirectoryFileName = readDirectoryFile.name.split('.');
              splitDirectoryFileName.pop();
              return splitDirectoryFileName.join('.') === file.name.split('/').slice(-1)[0]
            } else if (!readDirectoryFile.name.endsWith('.gz') && !readDirectoryFile.name.endsWith('.json')) {
              return readDirectoryFile.name === file.name.split('/').slice(-1)[0]
            }
          });
          // parse file
          let parsedFoundReadDirectoryFile;
          if (foundReadDirectoryFile.name.endsWith('.gz')) {
            // deocde file
            const decodedGzFile = await filesService.decodeGzFile(foundReadDirectoryFile.path);
            // parse and store file
            parsedFoundReadDirectoryFile = logsService.parseLogGroupFile(decodedGzFile);
          } else if (!foundReadDirectoryFile.name.endsWith('.gz') && !foundReadDirectoryFile.name.endsWith('.json')) {
            // read file
            const readTextFile = await filesService.readTextFile(foundReadDirectoryFile.path);
            // parse and store file
            parsedFoundReadDirectoryFile = logsService.parseLogGroupFile(readTextFile);
          }
          // set data of the log group file instance
          file.data = parsedFoundReadDirectoryFile;
          // return explicitly
          return file;
        }));
        // replace each log group file in the
        // log group instance that is a copy
        // of the internal log group instance
        for (const file of parsedLogGroupFiles) {
          newLogGroup.replaceFile({ hash: file.hash }, file);
        }
        console.log('parsedLogGroupFiles=', parsedLogGroupFiles);
        // replace the log files of the current log group
        _logsStore.update((state) => {
          console.log(state);
          const foundLogGroupIndex = _.findIndex(state.logGroups, { logGroupId: logGroup.logGroupId });
          console.log('foundLogGroupIndex=', foundLogGroupIndex);
          const foundLogGroup = new LogGroup(_.assign({}, state.logGroups[foundLogGroupIndex]));
          console.log('foundLogGroup=', foundLogGroup);
          for (const logGroupFile of newLogGroup.files) {
            foundLogGroup.replaceFile({ hash: logGroupFile.hash }, logGroupFile);
          }
          // create a new stae based on the old state
          const newState = _.assign(
            {},
            state
          );
          // replace/mutate/update the old state here
          newState.logGroups[foundLogGroupIndex] = foundLogGroup;
          console.log('newState=', newState)
          // return new state
          return _.assign({}, newState);
        });
        // parse each file
        // const parsedFiles = await logGroup.files.map(async (file) => {
        //   // try to find the file in the read directory
        //   const foundReadDirectoyFile = readDirectory.map((readDirectoryFile) => readDirectoryFile.)
        //   if ((file.name as string).endsWith('.gz') && !(file.name as string).endsWith('.json')) {
        //     const splitFilename = file.name.slice().split('.');
        //     splitFilename.pop();
        //     if (logGroup.files.find((logGroupFile) => logGroupFile.name.split('/').slice(-1)[0] === splitFilename.join('.'))) {
        //       files.push(file);
        //     }
        //   } else if (!(file.name as string).endsWith('.gz') && !(file.name as string).endsWith('.json')) {
        //     if (logGroup.files.find((logGroupFile) => logGroupFile.name.split('/').slice(-1)[0] === file.name)) {
        //       files.push(file);
        //     }
        //   }
        // });
        // // filter out the files that we do not want to read
        // const filesForParsing = readDirectory.reduce((files: any[], file: any) => {
        //   return files;
        // }, []);
        // // now parse the files and update the log group
        // const parsedFiles = await Promise.all(filesForParsing.map(async (fileForParsing) => {
        //   const parsedFile = await logsService.parseLogGroupFile();
        //   // place data in the file for parsing
        //   fileForParsing.data = parsedFile;
        //   // reutrn explicitly
        //   return fileForParsing
        // }));
        // no update the store
      } catch (err) {
        console.log(err);
        throw err;
      }
    }
  };
}

const logsStore = createLogsStore();

export { logsStore };

// /* computed values */
// export const getTotalHeroes = derived(
//   heroStore,
//   $heroStore => $heroStore.heroes.length
// );