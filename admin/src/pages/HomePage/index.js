import React, { memo, useState, useEffect, useRef } from 'react';

import { fetchContentTypes } from '../../utils/api';

import ContentTypesTable from '../../components/ContentTypesTable';

import { LoadingIndicatorPage } from '@strapi/helper-plugin';

import { Box } from '@strapi/design-system/Box';
import { BaseHeaderLayout } from '@strapi/design-system/Layout';

const HomePage = () => {
  const contentTypes = useRef({});

  const [isLoading, setIsLoading] = useState(true);

  useEffect(async () => {
    contentTypes.current = await fetchContentTypes(); // Here

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <LoadingIndicatorPage />;
  }

  return (
    <>
      <Box background="neutral100">
        <BaseHeaderLayout
          title="Voting"
          subtitle="Add simple voting system to any collection type"
          as="h2"
        />
      </Box>

      <ContentTypesTable contentTypes={contentTypes.current} />
    </>
  );
};

export default memo(HomePage);