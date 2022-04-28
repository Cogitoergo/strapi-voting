/**
 *
 * Entity Details
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@strapi/design-system/Button';
import { Dialog, DialogBody, DialogFooter } from '@strapi/design-system/Dialog';
import { Flex } from '@strapi/design-system/Flex';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';
import { ExclamationMarkCircle, Check } from '@strapi/icons';

const getMessage = (message, initial) => message || initial

const ConfirmationDialog = ({ 
    isVisible = false,
    isActionAsync = false,
    children, 
    onConfirm, 
    onCancel, 
    header, 
    labelCancel, 
    labelConfirm, 
    iconConfirm
}) => (
    <Dialog onClose={onCancel} title={header || getMessage('compontents.confirmation.dialog.header', 'Confirmation')} isOpen={isVisible}>
        <DialogBody icon={<ExclamationMarkCircle />}>
        <Stack size={2}>
            <Flex justifyContent="center">
                <Typography id="dialog-confirm-description">{children || getMessage('compontents.confirmation.dialog.description') }</Typography>
            </Flex>
        </Stack>
        </DialogBody>
        <DialogFooter startAction={<Button onClick={onCancel} variant="tertiary" disabled={isActionAsync}>
            Cancel
            </Button>} endAction={<Button onClick={onConfirm} variant="danger-light" startIcon={iconConfirm || <Check />} disabled={isActionAsync}>
            { labelConfirm || '' }
            </Button>} />
    </Dialog>
  );

  ConfirmationDialog.propTypes = {
    isVisible: PropTypes.bool,
    isActionAsync: PropTypes.bool,
    children: PropTypes.array.isRequired,
    header: PropTypes.string,
    labelCancel: PropTypes.string,
    labelConfirm: PropTypes.string,
    iconConfirm: PropTypes.object,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

  export default ConfirmationDialog;