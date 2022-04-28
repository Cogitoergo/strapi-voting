import React, { memo, useState, useEffect, useRef } from 'react';
import { useParams } from "react-router-dom";
import { fetchCollection } from '../../utils/api';

import CollectionsTable from '../../components/CollectionsTable';

import { LoadingIndicatorPage } from '@strapi/helper-plugin';

import { Box } from '@strapi/design-system/Box';
import { BaseHeaderLayout } from '@strapi/design-system/Layout';

const InnerPage = () => {
  const { id } = useParams();
  const items = useRef({});

  const [isLoading, setIsLoading] = useState(true);

  useEffect(async () => {
    items.current = await fetchCollection(id); // Here

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
        <CollectionsTable items={items.current} />
      </Box>
    </>
  );
};

export default memo(InnerPage);