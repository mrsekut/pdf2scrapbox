export type ProfilePath = `${ProjectName}/${PageTitle}`;
type ProjectName = string;
type PageTitle = string;

type Page = {
  title: string;
  lines: string[];
};

export const createProfilePage = async (
  profilePath: ProfilePath,
): Promise<Page> => {
  const page = await fetchPageDetail(profilePath);

  return {
    title: page.title,
    lines: page.lines.map(line => line.text),
  };
};

const fetchPageDetail = async (
  profilePath: ProfilePath,
): Promise<PageDetail> => {
  const res = await fetch(`https://scrapbox.io/api/pages/${profilePath}`);

  if (!res.ok) {
    throw new Error('Failed to fetch Profile Page');
  }

  return res.json() as Promise<PageDetail>;
};

type PageDetail = {
  id: string;
  title: string;
  image: string;
  descriptions: string[];
  lines: {
    id: string;
    text: string;
    userId: string;
    created: number;
    updated: number;
  }[];
};
