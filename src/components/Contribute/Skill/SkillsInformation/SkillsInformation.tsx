import React, { useEffect } from 'react';
import { ValidatedOptions, FormGroup, TextInput, HelperText, HelperTextItem, TextArea } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

interface Props {
  reset: boolean;
  isEditForm?: boolean;
  submissionSummary: string;
  setSubmissionSummary: React.Dispatch<React.SetStateAction<string>>;
  documentOutline: string;
  setDocumentOutline: React.Dispatch<React.SetStateAction<string>>;
}

const SkillsInformation: React.FC<Props> = ({ reset, isEditForm, submissionSummary, setSubmissionSummary, documentOutline, setDocumentOutline }) => {
  const [validDescription, setValidDescription] = React.useState<ValidatedOptions>();
  const [validOutline, setValidOutline] = React.useState<ValidatedOptions>();

  useEffect(() => {
    setValidDescription(ValidatedOptions.default);
    setValidOutline(ValidatedOptions.default);
  }, [reset]);

  useEffect(() => {
    if (isEditForm) {
      setValidDescription(ValidatedOptions.success);
      setValidOutline(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateDescription = (description: string) => {
    if (description.length > 0 && description.length < 60) {
      setValidDescription(ValidatedOptions.success);
      return;
    }
    setValidDescription(ValidatedOptions.error);
    return;
  };

  const validateOutline = (outline: string) => {
    if (outline.length > 40) {
      setValidOutline(ValidatedOptions.success);
      return;
    }
    setValidOutline(ValidatedOptions.error);
    return;
  };

  return (
    <>
      <h2>
        <strong>Skill Information</strong> <span style={{ color: 'red' }}>*</span>
      </h2>
      <p>Provide brief information about the Skills.</p>

      <FormGroup isRequired key={'skills-info-details-submission_summary'} label="Submission summary">
        <TextInput
          isRequired
          type="text"
          aria-label="submission_summary"
          placeholder="Enter a brief description for a submission summary (60 character max)"
          value={submissionSummary}
          validated={validDescription}
          onChange={(_event, value) => setSubmissionSummary(value)}
          onBlur={() => validateDescription(submissionSummary)}
          maxLength={60}
        />
        {validDescription === ValidatedOptions.error && (
          <HelperText>
            <HelperTextItem icon={<ExclamationCircleIcon />} variant={validDescription}>
              Required field. Must be less than 60 characters. {60 - submissionSummary.trim().length} characters remaining
            </HelperTextItem>
          </HelperText>
        )}
      </FormGroup>
      <FormGroup isRequired key={'skills-info-details-document_outline'} label="Document Outline">
        <TextArea
          isRequired
          type="text"
          aria-label="document_outline"
          placeholder="Enter a detailed description to improve the teacher model's responses (min 40 characters)"
          value={documentOutline}
          validated={validOutline}
          onChange={(_event, value) => setDocumentOutline(value)}
          minLength={40}
          onBlur={() => validateOutline(documentOutline)}
        />
        {validOutline === ValidatedOptions.error && (
          <HelperText>
            <HelperTextItem icon={<ExclamationCircleIcon />} variant={validOutline}>
              Required field and must be at least 40 characters.{' '}
              {40 - documentOutline.trim().length > 0 ? 40 - documentOutline.trim().length + 'more to go.' : ''}
            </HelperTextItem>
          </HelperText>
        )}
      </FormGroup>
    </>
  );
};

export default SkillsInformation;
