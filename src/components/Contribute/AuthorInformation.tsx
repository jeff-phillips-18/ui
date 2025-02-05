import React, { useEffect, useState } from 'react';
import { ValidatedOptions, FormGroup, TextInput, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

export enum FormType {
  Knowledge,
  Skill
}

interface Props {
  reset: boolean;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
}
const AuthorInformation: React.FC<Props> = ({ reset, email, setEmail, name, setName }) => {
  const [validEmail, setValidEmail] = useState<ValidatedOptions>();
  const [validName, setValidName] = useState<ValidatedOptions>();
  const [validEmailError, setValidEmailError] = useState('Required Field');

  const validateEmail = (emailStr: string) => {
    const email = emailStr.trim();
    const re = /\S+@\S+\.\S+/;
    if (re.test(email)) {
      setValidEmail(ValidatedOptions.success);
      setValidEmailError('');
      return;
    }
    const errMsg = email ? 'Please enter a valid email address.' : 'Required field';
    setValidEmail(ValidatedOptions.error);
    setValidEmailError(errMsg);
    return;
  };

  const validateName = (nameStr: string) => {
    const name = nameStr.trim();
    if (name.length > 0) {
      setValidName(ValidatedOptions.success);
      return;
    }
    setValidName(ValidatedOptions.error);
    return;
  };

  useEffect(() => {
    setValidEmail(ValidatedOptions.default);
    setValidName(ValidatedOptions.default);
  }, [reset]);

  return (
    <>
      <h2>
        <strong>Author Information </strong>
        <span style={{ color: 'red' }}>*</span>
      </h2>
      <p>Provide your information required for a GitHub DCO sign-off.</p>
      <FormGroup isRequired key={'author-info-details-email'} label="Email address">
        <TextInput
          isRequired
          type="email"
          aria-label="email"
          placeholder="Enter your email address"
          value={email}
          validated={validEmail}
          onChange={(_event, value) => setEmail(value)}
          onBlur={() => validateEmail(email)}
        />
        {validEmail === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validEmail}>
                {validEmailError}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
      <FormGroup isRequired key={'author-info-details-name'} label="Full name">
        <TextInput
          isRequired
          type="text"
          aria-label="name"
          placeholder="Enter your full name"
          value={name}
          validated={validName}
          onChange={(_event, value) => setName(value)}
          onBlur={() => validateName(name)}
        />
        {validName === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validName}>
                Required field
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
    </>
  );
};

export default AuthorInformation;
