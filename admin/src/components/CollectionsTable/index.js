/*
 *
 * HomePage
 *
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';
import { LinkButton } from '@strapi/design-system/LinkButton';
import { IconButton } from '@strapi/design-system/IconButton';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import { Flex } from '@strapi/design-system/Flex';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import Plus from '@strapi/icons/Plus';
import CarretDown from '@strapi/icons/CarretDown';
// API
import { vote } from '../../utils/api';
const handleVoting = async (uid, id) => {
  await vote(uid, id)
  console.table([{ 'UID': uid, 'ID': id }])
}
const CollectionsTable = ({ items }) => {
  const { id } = useParams();
  return (
    items && !_.isEmpty(items) ? (
    <Box padding={8}>
      <Table colCount={2} rowCount={items.length}>
        <Thead>
          <Tr>
            <Th action={<IconButton label="Sort on Name" icon={<CarretDown />} noBorder />}>
              <Typography variant="sigma">Name</Typography>
            </Th>
            <Th action={<IconButton label="Sort on Votes" icon={<CarretDown />} noBorder />}>
              <Typography variant="sigma">Votes</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item) => (
            <Tr key={item.id}>
              <Td>
                <Typography textColor="neutral800">
                  {item.title || item.name || item.test}
                </Typography>
              </Td>
              <Td>
                <Typography textColor="neutral800">
                  {item.votes}
                </Typography>
              </Td>
              <Td>
                <Flex justifyContent="right" alignItems="right">
                  <LinkButton onClick={() => handleVoting(id, item.id)}>
                    Vote!
                  </LinkButton>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>)
    : (<Box padding={8}>
      <EmptyStateLayout
        content="You don't have any items in this collection yet..."
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
    </Box>)
  );
};

export default CollectionsTable;