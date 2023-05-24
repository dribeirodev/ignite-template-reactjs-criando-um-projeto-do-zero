import { useCallback, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { Query, PrismicDocument } from '@prismicio/types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const formatResult = (
  postsResponse: Query<PrismicDocument<Record<string, any>, string, string>>
): PostPagination => {
  return {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    }),
  };
};

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(formatResult(postsPagination as any));

  const handleNextPage = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(posts.next_page);
      const resJson = await res.json();
      const postsFormat = formatResult(resJson);

      const newPosts = {
        next_page: postsFormat.next_page,
        results: [...posts.results, ...postsFormat.results],
      };
      setPosts(newPosts);
    } catch (error) {
      alert(error.message);
    }
  }, [posts]);

  return (
    <>
      <Head>
        <title>Posts</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.post}>
          {posts.results.map(post => (
            <span key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <strong>{post.data.title}</strong>
              </Link>
              <p className={styles.title}>{post.data.subtitle}</p>
              <div>
                <span>
                  <FiCalendar size={20} />
                  <time>{post.first_publication_date}</time>
                </span>
                <span>
                  <FiUser size={20} />
                  <p>{post.data.author}</p>
                </span>
              </div>
            </span>
          ))}
        </div>
        <div className={styles.nextPage}>
          {posts.next_page && (
            <button onClick={handleNextPage} type="button">
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 1,
  });

  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
