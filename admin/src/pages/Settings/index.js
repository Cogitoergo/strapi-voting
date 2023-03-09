import React, { memo, useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
// Api
import { fetchContentTypes } from '../../utils/api';
// Config
import useConfig from '../../hooks/useConfig';
import { Formik } from 'formik';
import {
  Form,
  useOverlayBlocker,
  useAutoReloadOverlayBlocker,
	LoadingIndicatorPage,
  useNotification
} from '@strapi/helper-plugin';
import { isEqual, first } from 'lodash';
import { Accordion, AccordionToggle, AccordionContent, AccordionGroup } from '@strapi/design-system/Accordion';
import { Main } from '@strapi/design-system/Main';
import { ContentLayout, HeaderLayout } from '@strapi/design-system/Layout';
import { Button } from '@strapi/design-system/Button';
import { Checkbox } from '@strapi/design-system';
import { Box } from '@strapi/design-system/Box';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Select, Option } from '@strapi/design-system/Select';
import { Tooltip } from '@strapi/design-system/Tooltip';
import { Check, Information, Refresh, Play } from '@strapi/icons';
import { DatePicker } from '@strapi/design-system/DatePicker';

import { RestartAlert } from '../../components/RestartAlert/styles';
import ConfirmationDialog from '../../components/ConfirmationDialog';

const Settings = () => {
  const [restoreConfirmationVisible, setRestoreConfirmationVisible] = useState(false);
	const [restartRequired, setRestartRequired] = useState(false);
  const [contentTypeExpanded, setContentTypeExpanded] = useState(undefined);
  const [availableFields, setAvailableFields] = useState([]);

  const toggleNotification = useNotification();
  const { lockApp, unlockApp } = useOverlayBlocker();
  const { lockAppWithAutoreload, unlockAppWithAutoreload } = useAutoReloadOverlayBlocker();

  const { fetch, restartMutation, submitMutation, restoreMutation } = useConfig(toggleNotification);
	const { data: configData, isLoading: isConfigLoading, err: configErr } = fetch;
  const { data: allCollectionsData, isLoading: areCollectionsLoading, err: collectionsErr } = useQuery(
    'get-all-content-types',
    () => fetchContentTypes(toggleNotification)
  );

  const isLoading = isConfigLoading || areCollectionsLoading;
	const isError = configErr || collectionsErr;

  const preparePayload = ({ enabledCollections, votingPeriods, entryLabel, googleRecaptcha, ...rest }) => {
		const payload = {
      ...rest,
      enabledCollections: enabledCollections,
      entryLabel: {
        ...Object.keys(entryLabel).reduce((prev, curr) => ({
          ...prev,
          [curr]: enabledCollections.includes(curr) ? entryLabel[curr] : undefined,
        }), {}),
        '*': entryLabel['*'],
      },
      googleRecaptcha: {
        ...Object.keys(googleRecaptcha).reduce((prev, curr) => ({
          ...prev,
          [curr]: enabledCollections.includes(curr) ? googleRecaptcha[curr] : undefined,
        }), {}),
        '*': googleRecaptcha['*'],
      },
      votingPeriods: {
        ...Object.keys(votingPeriods).reduce((prev, curr) => ({
          ...prev,
          [curr]: enabledCollections.includes(curr) ? votingPeriods[curr] : undefined,
        }), {})
      },
    };
    console.log('PREPARED PAYLOAD', payload);
    return payload;
	};

  if (isLoading || isError) {
		return (<LoadingIndicatorPage>..Loading..</LoadingIndicatorPage>);
	}

  const REGEX = {
    uid: "/^(?<type>[a-z0-9-]+)\:{2}(?<api>[a-z0-9-]+)\.{1}(?<contentType>[a-z0-9-]+)$/i",
    relatedUid: "/^(?<uid>[a-z0-9-]+\:{2}[a-z0-9-]+\.[a-z0-9-]+)\:{1}(?<id>[a-z0-9-]+)$/i",
    email: "/\S+@\S+\.\S+/",
    sorting: "/^(?<path>[a-z0-9-_\:\.]+)\:+(asc|desc)$/i"
  };

  const parseRegExp = (regexpString) => {
    const [value, flags] = regexpString.split('/').filter(_ => _.length > 0);
    return {
      value,
      flags,
    };
  };

  const regexUID = !isLoading ? new RegExp(
		parseRegExp(REGEX.uid).value,
		parseRegExp(REGEX.uid).flags
	) : null;

  const allCollections = !isLoading && allCollectionsData && allCollectionsData.collectionTypes
		.filter(({ uid }) => first(uid.split(regexUID).filter(s => s && s.length > 0)) === 'api');
	
  const enabledCollections = configData.enabledCollections && !_.isEmpty(configData.enabledCollections) ? configData.enabledCollections
    .map(uid => allCollections.find(_ => _.uid === uid) ? uid : undefined)
    .filter(_ => _) : []

  const entryLabel = configData.entryLabel || {};
  const votingPeriods = configData.votingPeriods || {};
  const googleRecaptcha = configData.googleRecaptcha || {};

  const handleUpdateConfiguration = async (form) => {

    lockApp();

    const payload = preparePayload(form);
    await submitMutation.mutateAsync(payload);
    const enabledCollectionsChanged = !isEqual(payload.enabledCollections, configData?.enabledCollections);
    const votingPeriodsChanged = !isEqual(payload.votingPeriods, configData?.votingPeriods);
    const googleRecaptchaChanged = !isEqual(payload.googleRecaptcha, configData?.googleRecaptcha);

    if (enabledCollectionsChanged || votingPeriodsChanged || googleRecaptchaChanged) {
      setRestartRequired(true);
    }

    unlockApp();
	};

  const handleRestoreConfirmation = () => setRestoreConfirmationVisible(true);
	const handleRestoreConfiguration = async () => {
    lockApp();
    await restoreMutation.mutateAsync();
    unlockApp();
    setRestartRequired(true);
    setRestoreConfirmationVisible(false);
	};
	const handleRestoreCancel = () => setRestoreConfirmationVisible(false);

	const handleRestart = async () => {
    lockAppWithAutoreload();
    await restartMutation.mutateAsync();
    setRestartRequired(false);
    unlockAppWithAutoreload();
	};

	const handleRestartDiscard = () => setRestartRequired(false);

  const handleSetContentTypeExpanded = (contentType) => {
    setContentTypeExpanded(contentTypeExpanded && contentType === contentTypeExpanded ? undefined : contentType);
    handleSetAvailableFields(getCollectionField(contentType, 'attributes'));
  };

  const getCollectionField = (collection, field) => {
    const contentType = allCollections.filter(_ => _.uid === collection).pop()
    return contentType[field] || ''
  }
  
  const handleSetAvailableFields = (attributes) => {
    const attributeKeys = Object.keys(attributes);
    if (_.isEmpty(attributeKeys)) {
      setAvailableFields([]);
    };
    setAvailableFields(attributeKeys
      .map((key) => {
        const y = attributes[key];
        y.name = key;
        return y;
      })
      .filter(item => item.type === 'integer'));
  };

  const changeEntryLabelFor = (uid, current, value) => {
		const temp = {
      ...current,
		  [uid]: value && !_.isEmpty(value) ? value : undefined,
    };
    return temp;
	};

  const changeRecaptchaFor = (uid, current, value) => {
		const temp = {
      ...current,
		  [uid]: value ? value : false,
    };
    return temp;
	};

  const changeVotingPeriodFor = (uid, current, value, type) => {
    const dateObj = current[uid] || {};
    const date = value;
    if (type === 'start') {
      dateObj.start = date;
    } else if (type === 'end') {
      dateObj.end = date;
    };
		const temp = {
      ...current,
		  [uid]: dateObj,
    };
    return temp;
	};

  const boxDefaultProps = {
		background: "neutral0",
		hasRadius: true,
		shadow: "filterShadow",
		padding: 6,
	};

	return (
		<Main>
      <Formik
				initialValues={{
					enabledCollections,
					entryLabel,
          votingPeriods,
          googleRecaptcha
				}}
				enableReinitialize={true}
				onSubmit={handleUpdateConfiguration}
			>
				{({ handleSubmit, setFieldValue, values }) => (
        <Form noValidate onSubmit={handleSubmit}>
          <HeaderLayout
            title="Voting"
            subtitle="Configure your voting plugin capabilities"
            primaryAction={
              <Button type="submit" startIcon={<Check />} loading={isLoading} disabled={restartRequired} >
                Save
              </Button>
            }
          />
          <ContentLayout>
            <Stack spacing={4}>
            { restartRequired && (
              <RestartAlert 
                closeLabel="Cancel"
                title="Restart is required"
                action={<Box><Button onClick={handleRestart} startIcon={<Play />}>Restart now</Button></Box>}
                onClose={handleRestartDiscard}>
                You must restart mate
              </RestartAlert>)}
              <Box {...boxDefaultProps}>
                <Stack spacing={4}>
                  <Typography variant="delta" as="h2">
                    General configuration
                  </Typography>
                  <Grid gap={4}>
                    <GridItem col={12}>
                      <Select
                        id="enabledCollections-select"
                        onClear={() => setFieldValue('enabledCollections', [], false)}
                        clearLabel="Clear all collections"
                        value={values.enabledCollections}
                        onChange={(value) => setFieldValue('enabledCollections', value, false)}
                        multi
                        disabled={restartRequired}
                        name="enabledCollections"
                        label="Enable voting for"
                        placeholder="Select one or more collection"
                        hint="If none is selected, voting is disabled."
                        withTags
                      >
                        {
                          allCollectionsData &&
                          allCollectionsData.collectionTypes &&
                          !_.isEmpty(allCollectionsData.collectionTypes) ? (
                            allCollectionsData.collectionTypes.map((item) => (
                              <Option
                                key={item.uid}
                                value={item.uid}
                              >
                                {item.globalId}
                              </Option>
                            ))
                          ) : ''
                        }
                      </Select>
                    </GridItem>
                    { values.enabledCollections && !_.isEmpty(values.enabledCollections) && (
                    <GridItem col={12}>
                      <AccordionGroup
                        label="Custom settings per content type"
                        labelAction={<Tooltip description="Configure each collection types settings like voting field and voting duration."><Information aria-hidden={true} /></Tooltip>}>
                          {
                            values.enabledCollections.map((collection) => {
                            const key = `collectionSettings-${collection}`
                            return (
                              <Accordion
                                expanded={contentTypeExpanded && contentTypeExpanded === collection}
                                onToggle={() => handleSetContentTypeExpanded(collection)}
                                key={key}
                                id={key}
                                size="S"
                              >
                                <AccordionToggle
                                  title={getCollectionField(collection, 'globalId')}
                                  togglePosition="left"
                                />
                                <AccordionContent>
                                  <Box {...boxDefaultProps}>
                                    <Stack spacing={4}>
                                      <Grid gap={4}>
                                        <GridItem col={6}>
                                          <DatePicker
                                            label={'Set voting start date'}
                                            placeholder="Choose start date"
                                            hint={'If not set voting have already started.'}
                                            onClear={() => setFieldValue('votingPeriods', changeVotingPeriodFor(collection, values.votingPeriods, null, 'start'))}
                                            onChange={(value) => setFieldValue('votingPeriods', changeVotingPeriodFor(collection, values.votingPeriods, value, 'start'))}
                                            selectedDate={values.votingPeriods[collection] && values.votingPeriods[collection].start ? new Date(values.votingPeriods[collection].start) : null}
                                            clearLabel={'Clear'}
                                            selectedDateLabel={formattedDate => `Voting start date set on ${formattedDate}`}
                                            disabled={restartRequired}
                                          />
                                        </GridItem>
                                        <GridItem col={6}>
                                          <DatePicker
                                            label={'Set voting end date'}
                                            placeholder="Choose end date"
                                            hint={'If not set voting never ends.'}
                                            onClear={() => setFieldValue('votingPeriods', changeVotingPeriodFor(collection, values.votingPeriods, null, 'end'))}
                                            onChange={(value) => setFieldValue('votingPeriods', changeVotingPeriodFor(collection, values.votingPeriods, value, 'end'))}
                                            selectedDate={values.votingPeriods[collection] && values.votingPeriods[collection].end ? new Date(values.votingPeriods[collection].end) : null}
                                            clearLabel={'Clear'}
                                            selectedDateLabel={formattedDate => `Voting end date set on ${formattedDate}`}
                                            disabled={restartRequired}
                                          />
                                        </GridItem>
                                      </Grid>
                                    </Stack>
                                  </Box>
                                  <Box {...boxDefaultProps}>
                                    <Stack spacing={4}>
                                      <Grid gap={4}>
                                        <GridItem col={4}>
                                          <Select
                                            id="enabledFields-select"
                                            clearLabel="Clear selected field."
                                            value={values.entryLabel && values.entryLabel[collection] || []}
                                            onChange={(value) => setFieldValue('entryLabel', changeEntryLabelFor(collection, values.entryLabel, value))}
                                            onClear={() => setFieldValue('entryLabel', changeEntryLabelFor(collection, values.entryLabel))}
                                            name="enabledFields"
                                            label="Choose field to add votes to"
                                            placeholder="votes"
                                            hint="Defaults to 'votes' field if none is selected. Must be integer."
                                            disabled={restartRequired}
                                          >
                                            {
                                              availableFields &&
                                              !_.isEmpty(availableFields) ? (
                                                availableFields
                                                  .map((item) => (
                                                    <Option
                                                      key={item.name}
                                                      value={item.name}
                                                    >
                                                      {item.name}
                                                    </Option>
                                                  ))
                                              ) : ''
                                            }
                                          </Select>
                                        </GridItem>
                                        <GridItem col={4}>
                                          <Checkbox
                                            label="Enable Google Recaptcha for the given collection"
                                            hint="(Requires client/front side implementation)"
                                            value={values.googleRecaptcha && values.googleRecaptcha[collection] || false}
                                            onChange={(value) => setFieldValue('googleRecaptcha', changeRecaptchaFor(collection, values.googleRecaptcha, value))}
                                          >
                                            Google Recaptcha
                                          </Checkbox>
                                        </GridItem>
                                      </Grid>
                                    </Stack>
                                  </Box>
                                </AccordionContent>
                              </Accordion>
                            )})
                          }
                      </AccordionGroup>
                    </GridItem>
                  )}
                  </Grid>
                </Stack>
              </Box>
              <Box {...boxDefaultProps}>
                <Stack size={4}>
                  <Stack size={2}>
                    <Typography variant="delta" as="h2">
                      Restore default settings
                    </Typography>
                    <Typography variant="pi"as="h4">
                      Discarding all of applied settings and getting back to plugin default ones. Use reasonably.
                    </Typography>
                  </Stack>
                  <Grid gap={4}>
                    <GridItem col={6}>
                      <Button variant="danger-light" startIcon={<Refresh />} onClick={handleRestoreConfirmation}>
                        Restore default settings
                      </Button>
                      <ConfirmationDialog
                        isVisible={restoreConfirmationVisible}
                        isActionAsync={restoreMutation.isLoading}
                        header="Restore default configuration"
                        labelConfirm="Confirm"
                        iconConfirm={<Refresh />}
                        onConfirm={handleRestoreConfiguration} 
                        onCancel={handleRestoreCancel}>
                          You're about to restore plugin configuration to it default values. It might have destructive impact on already collected content. Do you really want to proceed?
                      </ConfirmationDialog>
                    </GridItem>
                  </Grid>
                </Stack>
              </Box>
            </Stack>
          </ContentLayout>
        </Form>
				)}
			</Formik>
		</Main>
	);
}


export default memo(Settings);