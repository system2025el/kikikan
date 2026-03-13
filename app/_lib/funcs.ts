'use server';

export const serverErrorLog = (errorLog: Error) => {
  console.error(errorLog);
};
