// src/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation.tsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertActionLink,
  AlertActionCloseButton,
  AlertGroup,
  Button,
  Content,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  TextInput
} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { UploadFile } from '@/components/Contribute/Knowledge/UploadFile';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

const GITHUB_KNOWLEDGE_FILES_URL = '/api/github/knowledge-files';
const NATIVE_GIT_KNOWLEDGE_FILES_URL = '/api/native/git/knowledge-files';

interface Props {
  isEditForm?: boolean;
  isGithubMode: boolean;
  knowledgeDocumentRepositoryUrl: string;
  setKnowledgeDocumentRepositoryUrl: (val: string) => void;
  knowledgeDocumentCommit: string;
  setKnowledgeDocumentCommit: (val: string) => void;
  documentName: string;
  setDocumentName: (val: string) => void;
}

interface AlertInfo {
  type: 'success' | 'danger' | 'info';
  title: string;
  message: string;
  link?: string;
}

const DocumentInformation: React.FC<Props> = ({
  isEditForm,
  isGithubMode,
  knowledgeDocumentRepositoryUrl,
  setKnowledgeDocumentRepositoryUrl,
  knowledgeDocumentCommit,
  setKnowledgeDocumentCommit,
  documentName,
  setDocumentName
}) => {
  const [showUploadFromGitModal, setShowUploadFromGitModal] = React.useState<boolean>();
  const [useFileUpload, setUseFileUpload] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalText, setModalText] = useState<string | undefined>();

  const [alertInfo, setAlertInfo] = useState<AlertInfo | undefined>();

  const [validRepo, setValidRepo] = useState<ValidatedOptions>(ValidatedOptions.default);
  const [validCommit, setValidCommit] = useState<ValidatedOptions>(ValidatedOptions.default);
  const [validDocumentName, setValidDocumentName] = useState<ValidatedOptions>(ValidatedOptions.default);

  useEffect(() => {
    if (isEditForm) {
      setValidRepo(ValidatedOptions.success);
      setValidCommit(ValidatedOptions.success);
      setValidDocumentName(ValidatedOptions.success);
    }
  }, [isEditForm]);

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

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length > 0) {
      const alertInfo: AlertInfo = {
        type: 'info',
        title: 'Document upload(s) in progress!',
        message: 'Document upload(s) is in progress. You will be notified once the upload successfully completes.'
      };
      setAlertInfo(alertInfo);

      const fileContents: { fileName: string; fileContent: string }[] = [];

      await Promise.all(
        uploadedFiles.map(
          (file) =>
            new Promise<void>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const fileContent = e.target!.result as string;
                fileContents.push({ fileName: file.name, fileContent });
                resolve();
              };
              reader.onerror = reject;
              reader.readAsText(file);
            })
        )
      );

      if (fileContents.length === uploadedFiles.length) {
        try {
          const response = await fetch(isGithubMode ? GITHUB_KNOWLEDGE_FILES_URL : NATIVE_GIT_KNOWLEDGE_FILES_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: fileContents })
          });

          if (response.status === 201 || response.ok) {
            const result = await response.json();
            console.log('Files uploaded result:', result);
            setKnowledgeDocumentRepositoryUrl(result.repoUrl);
            setKnowledgeDocumentCommit(result.commitSha);
            setDocumentName(result.documentNames.join(', ')); // Populate the patterns field

            const alertInfo: AlertInfo = {
              type: 'success',
              title: 'Document uploaded successfully!',
              message: 'Documents have been submitted to local taxonomy knowledge docs repo to be referenced in the knowledge submission.'
            };
            if (result.prUrl !== '') {
              alertInfo.link = result.prUrl;
            }
            setAlertInfo(alertInfo);
          } else {
            console.error('Knowledge document upload failed:', response.statusText);
            const alertInfo: AlertInfo = {
              type: 'danger',
              title: 'Failed to upload document!',
              message: `This upload failed. ${response.statusText}`
            };
            setAlertInfo(alertInfo);
          }
        } catch (error) {
          console.error('Knowledge document upload encountered an error:', error);
          const alertInfo: AlertInfo = {
            type: 'danger',
            title: 'Failed to upload document!',
            message: `This upload failed. ${(error as Error).message}`
          };
          setAlertInfo(alertInfo);
        }
      }
    }
  };

  const handleModalContinue = () => {
    if (useFileUpload) {
      setUploadedFiles([]);
    } else {
      console.log('Switching to manual entry - clearing repository and document info');
      setKnowledgeDocumentRepositoryUrl('');
      setValidRepo(ValidatedOptions.default);
      setKnowledgeDocumentCommit('');
      setValidCommit(ValidatedOptions.default);
      setDocumentName('');
      setValidDocumentName(ValidatedOptions.default);
    }
    setUseFileUpload(!useFileUpload);
    setIsModalOpen(false);
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <Content component="h4">Upload documents</Content>
        <Content component="p">
          Resources such as textbooks, technical manuals, encyclopedias, journals, or websites are used as the knowledge source for training your
          model.{' '}
          <Button
            isInline
            variant="link"
            component="a"
            icon={<ExternalLinkAltIcon />} href="https://docs.instructlab.ai/taxonomy/upstream/knowledge_contribution_details/#accepted-sources-of-knowledge"
            iconPosition="end"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn about accepted sources
          </Button>
        </Content>
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup isRequired label="Uploaded files">
            <UploadFile onFilesChange={handleFilesChange} />
          </FormGroup>
        </Form>
      </FlexItem>
      <FlexItem>
        <Button variant="primary" onClick={handleDocumentUpload} isDisabled={uploadedFiles.length === 0}>
          Submit Files
        </Button>
      </FlexItem>
      {alertInfo && (
        <AlertGroup isToast isLiveRegion>
          <Alert
            timeout
            variant={alertInfo.type}
            title={alertInfo.title}
            actionClose={<AlertActionCloseButton onClose={() => setAlertInfo(undefined)} />}
          >
            {alertInfo.message}
            {alertInfo.link && (
              <AlertActionLink href={alertInfo.link} target="_blank" rel="noopener noreferrer">
                View it here
              </AlertActionLink>
            )}
          </Alert>
        </AlertGroup>
      )}
      {isModalOpen ? (
        <Modal variant={ModalVariant.medium} isOpen onClose={() => setIsModalOpen(false)}>
          <ModalHeader title="Data Loss Warning" titleIconVariant="warning" />
          <ModalBody>{modalText}</ModalBody>
          <ModalFooter>
            <Button key="Continue" variant="secondary" onClick={handleModalContinue}>
              Continue
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </Flex>
  );
};

export default DocumentInformation;
