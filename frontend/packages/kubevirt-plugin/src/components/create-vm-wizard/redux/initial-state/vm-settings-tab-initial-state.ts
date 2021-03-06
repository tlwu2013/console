import { OrderedSet } from 'immutable';
import { CommonData, VMSettingsField, VMWizardProps } from '../../types';
import { asHidden, asRequired } from '../../utils/utils';
import { ProvisionSource } from '../../../../types/vm';

export const getInitialVmSettings = (common: CommonData) => {
  const {
    data: { isCreateTemplate },
  } = common;

  const provisionSources = [
    // ProvisionSource.PXE, // TODO: uncomment when storage tab is implemented
    ProvisionSource.URL,
    ProvisionSource.CONTAINER,
    // ProvisionSource.CLONED_DISK, // TODO: uncomment when storage tab is implemented
  ];

  const fields = {
    [VMSettingsField.NAME]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.DESCRIPTION]: {},
    [VMSettingsField.USER_TEMPLATE]: {
      isHidden: asHidden(isCreateTemplate, VMWizardProps.isCreateTemplate),
      initialized: false,
    },
    [VMSettingsField.PROVISION_SOURCE_TYPE]: {
      isRequired: asRequired(true),
      sources: OrderedSet(provisionSources),
    },
    [VMSettingsField.CONTAINER_IMAGE]: {},
    [VMSettingsField.IMAGE_URL]: {},
    [VMSettingsField.OPERATING_SYSTEM]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.FLAVOR]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.MEMORY]: {},
    [VMSettingsField.CPU]: {},
    [VMSettingsField.WORKLOAD_PROFILE]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.START_VM]: {
      isHidden: asHidden(isCreateTemplate, VMWizardProps.isCreateTemplate),
    },
    [VMSettingsField.USE_CLOUD_INIT]: {},
    [VMSettingsField.USE_CLOUD_INIT_CUSTOM_SCRIPT]: {},
    [VMSettingsField.HOST_NAME]: {},
    [VMSettingsField.AUTHKEYS]: {},
    [VMSettingsField.CLOUD_INIT_CUSTOM_SCRIPT]: {},
  };

  Object.keys(fields).forEach((k) => {
    fields[k].key = k;
  });
  return fields;
};

export const getVmSettingsInitialState = (props) => ({
  value: getInitialVmSettings(props),
  isValid: false,
});
