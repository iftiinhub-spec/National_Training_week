export const pick = (source, allowedFields) => Object.fromEntries(
  allowedFields
    .filter((field) => source[field] !== undefined)
    .map((field) => [field, source[field]])
);
