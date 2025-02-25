// src/components/Contribute/Knowledge/UploadFile.tsx
'use client';
import React from 'react';
import {
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader, Content, Form, FormGroup, TextInput, Flex, FlexItem
} from '@patternfly/react-core';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';

interface Props {
  onClose: () => void;
}

export const UploadFromGitModal: React.FunctionComponent<Props> = ({ onClose }) => {
  const [repositoryURL, setRepositoryURL] = React.useState<string>('');
  const [commitSHA, setCommitSHA] = React.useState<string>('');
  const [documentName, setDocumentName] = React.useState<string>('');
  const [validRepo, setValidRepo] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validCommit, setValidCommit] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validDocumentName, setValidDocumentName] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  const validateRepo = (repoStr: string) => {
    const repo = repoStr.trim();
    if (repo.length === 0) {
      setValidRepo(ValidatedOptions.error);
      return;
    }
    try {
      new URL(repo);
      setValidRepo(ValidatedOptions.success);
      return;
    } catch (e) {
      setValidRepo(ValidatedOptions.warning);
      return;
    }
  };

  const validateCommit = (commitStr: string) => {
    const commit = commitStr.trim();
    setValidCommit(commit.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateDocumentName = (document: string) => {
    const documentNameStr = document.trim();
    setValidDocumentName(documentNameStr.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const onSave = () => {
    // Call the API to get the document

    // Report any error

    // If successful, close the modal
    onClose();
  }
  return (
    <Modal
      variant="small"
      isOpen
      aria-label="upload from git repository"
      onClose={() => onClose()}
      aria-labelledby="unsupported-file-modal-title"
      aria-describedby="unsupported-file-body-variant"
    >
      <ModalHeader title="Document details" />
      <ModalBody>
        <Flex direction={{ default: 'column'}} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Content>Enter the document details below.</Content>
          </FlexItem>
          <FlexItem>
            <Form>
              <FormGroup isRequired fieldId="doc-name" label="Document name">
                <TextInput
                  id="doc-name"
                  isRequired
                  type="text"
                  aria-label="document name"
                  validated={validDocumentName}
                  value={documentName}
                  onChange={(_event, value) => setDocumentName(value)}
                  onBlur={() => validateDocumentName(documentName)}
                />
              </FormGroup>
              <FormGroup isRequired fieldId="repo-url" label="Repository URL">
                <TextInput
                  id="repo-url"
                  isRequired
                  type="text"
                  aria-label="repository url"
                  value={repositoryURL}
                  validated={validRepo}
                  onChange={(_event, value) => setRepositoryURL(value)}
                  onBlur={() => validateRepo(repositoryURL)}
                />
              </FormGroup>
              <FormGroup isRequired fieldId="commit-sha" label="Commit SHA">
                <TextInput
                  id="commit-sha"
                  isRequired
                  type="text"
                  value={commitSHA}
                  validated={validCommit}
                  onChange={(_event, value) => setCommitSHA(value)}
                  onBlur={() => validateCommit(commitSHA)}
                />
              </FormGroup>
            </Form>
          </FlexItem>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button key="save" variant="primary" onClick={() => onSave()}>
          Save
        </Button>
        <Button key="close" variant="secondary" onClick={() => onClose()}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UploadFromGitModal;
