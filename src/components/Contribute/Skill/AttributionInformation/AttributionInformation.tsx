import React, { useEffect } from 'react';
import { ValidatedOptions, FormGroup, TextInput, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

interface Props {
  reset: boolean;
  isEditForm?: boolean;
  titleWork: string;
  setTitleWork: React.Dispatch<React.SetStateAction<string>>;
  licenseWork: string;
  setLicenseWork: React.Dispatch<React.SetStateAction<string>>;
  creators: string;
  setCreators: React.Dispatch<React.SetStateAction<string>>;
}

const AttributionInformation: React.FC<Props> = ({
  reset,
  isEditForm,
  titleWork,
  setTitleWork,
  licenseWork,
  setLicenseWork,
  creators,
  setCreators
}) => {
  const [validTitle, setValidTitle] = React.useState<ValidatedOptions>();
  const [validLicense, setValidLicense] = React.useState<ValidatedOptions>();
  const [validCreators, setValidCreators] = React.useState<ValidatedOptions>();

  useEffect(() => {
    setValidTitle(ValidatedOptions.default);
    setValidLicense(ValidatedOptions.default);
    setValidCreators(ValidatedOptions.default);
  }, [reset]);

  useEffect(() => {
    if (isEditForm) {
      setValidTitle(ValidatedOptions.success);
      setValidLicense(ValidatedOptions.success);
      setValidCreators(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateTitle = (titleStr: string) => {
    const title = titleStr.trim();
    if (title.length > 0) {
      setValidTitle(ValidatedOptions.success);
      return;
    }
    setValidTitle(ValidatedOptions.error);
    return;
  };

  const validateLicense = (licenseStr: string) => {
    const license = licenseStr.trim();
    if (license.length > 0) {
      setValidLicense(ValidatedOptions.success);
      return;
    }
    setValidLicense(ValidatedOptions.error);
    return;
  };

  const validateCreators = (creatorsStr: string) => {
    const creators = creatorsStr.trim();
    if (creators.length > 0) {
      setValidCreators(ValidatedOptions.success);
      return;
    }
    setValidCreators(ValidatedOptions.error);
    return;
  };

  return (
    <>
      <h2>
        <strong>Attribution Information</strong> <span style={{ color: 'red' }}>*</span>
      </h2>
      <p>Provide attribution information for the skill.</p>

      <FormGroup isRequired key={'attribution-info-details-title_work'} label="Work title">
        <TextInput
          isRequired
          type="text"
          aria-label="title_work"
          placeholder="Enter title of work"
          validated={validTitle}
          value={titleWork}
          onChange={(_event, value) => setTitleWork(value)}
          onBlur={() => validateTitle(titleWork)}
        />
        {validTitle === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validTitle}>
                Required field
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
      <FormGroup isRequired key={'attribution-info-details-license_work'} label="Work License">
        <TextInput
          isRequired
          type="text"
          aria-label="license_work"
          placeholder="Enter license of the work"
          validated={validLicense}
          value={licenseWork}
          onChange={(_event, value) => setLicenseWork(value)}
          onBlur={() => validateLicense(licenseWork)}
        />
        {validLicense === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLicense}>
                Required field
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
      <FormGroup isRequired key={'attribution-info-details-creators'} label="Creators name">
        <TextInput
          isRequired
          type="text"
          aria-label="creators"
          placeholder="Enter creators Name"
          validated={validCreators}
          value={creators}
          onChange={(_event, value) => setCreators(value)}
          onBlur={() => validateCreators(creators)}
        />
        {validCreators === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validCreators}>
                Required field
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
    </>
  );
};

export default AttributionInformation;
