'use server';

export const serverErrorLog = async (errorMessage: string) => {
  console.error(errorMessage);
};
