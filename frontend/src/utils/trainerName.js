export const formatTrainerName = (trainer) => {
  const name = trainer?.name?.trim() || '';
  const title = trainer?.title?.trim() || '';

  if (!title || name.toLocaleLowerCase().startsWith(title.toLocaleLowerCase())) {
    return name;
  }

  return `${title} ${name}`;
};
