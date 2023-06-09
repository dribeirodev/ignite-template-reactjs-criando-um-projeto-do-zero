import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Content {
  heading: string;
  body: {
    text: string;
  }[];
}

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: Content[];
  };
}

interface PostProps {
  post: Post;
}

function calc(value: number): number {
  const wordsPerMinute = 200;
  const estimatedTime = Math.ceil(value / wordsPerMinute);
  return estimatedTime;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  const newPosts = {
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content: post.data.content,
    },
  };

  const numberWords = newPosts.data.content.reduce(
    (acc: number, items: Content): number => {
      acc += items.heading.split(' ').length;
      items.body.forEach(body => {
        acc += body.text.split(' ').length;
      });
      return acc;
    },
    0
  );
  const estimatedReadingTime = calc(numberWords);

  return (
    <>
      <Head>
        <title>{newPosts.data.title}</title>
      </Head>
      <section className={styles.bannerContainer}>
        <img src={newPosts.data.banner.url} alt={newPosts.data.title} />
      </section>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{newPosts.data.title}</h1>
          <div>
            <span>
              <FiCalendar size={20} />
              <time>{newPosts.first_publication_date}</time>
            </span>
            <span>
              <FiUser size={20} />
              <p>{newPosts.data.author}</p>
            </span>
            <span>
              <FiClock size={20} />
              <p>{estimatedReadingTime} min</p>
            </span>
          </div>
          {newPosts.data.content.map(content => (
            <section key={content.heading} className={styles.heading}>
              <h2>{content.heading}</h2>
              <p
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  // const posts = await prismic.query(
  //   Prismic.Predicates.at('document.type', 'posts')
  // );

  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
