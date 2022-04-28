/*
 *
 * HomePage
 *
 */

import React from 'react';
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';
import { LinkButton } from '@strapi/design-system/LinkButton';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import { Flex } from '@strapi/design-system/Flex';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import Plus from '@strapi/icons/Plus';

const ContentTypesTable = ({ contentTypes }) => {
  return (
    <Box padding={8}>
      <Table colCount={2} rowCount={contentTypes.collectionTypes.length}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">Name</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {contentTypes &&
          contentTypes.collectionTypes &&
          !_.isEmpty(contentTypes.collectionTypes) ? (
            contentTypes.collectionTypes.map((item) => (
              <Tr key={item.uid}>
                <Td>
                  <Typography textColor="neutral800">
                    {item.globalId}
                  </Typography>
                </Td>
                <Td>
                  <Flex justifyContent="right" alignItems="right">
                    <LinkButton 
                      to={`/plugins/strapi-voting/${item.uid}`}
                    >
                      View Results
                    </LinkButton>
                  </Flex>
                </Td>
              </Tr>
            ))
          ) : (
            <Box padding={8} background="neutral0">
              <EmptyStateLayout
                content="You don't have any collection-types yet..."
                action={
                  <LinkButton
                    to="/plugins/content-type-builder"
                    variant="secondary"
                    startIcon={<Plus />}
                  >
                    Create your first collection-type
                  </LinkButton>
                }
              />
            </Box>
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ContentTypesTable;