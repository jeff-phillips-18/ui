// src/components/Dashboard/Native/dashboard.tsx
import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import path from 'path';
import { AlertProps, PageBreadcrumb, Breadcrumb, BreadcrumbItem, PageSection, Title, Content, Popover, Button, AlertGroup, Alert, AlertVariant, AlertActionCloseButton, Spinner, EmptyState, EmptyStateBody, EmptyStateFooter, EmptyStateActions, Stack, StackItem, Card, CardBody, Flex, FlexItem, Tooltip, Modal, ModalVariant, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import { ExternalLinkAltIcon, OutlinedQuestionCircleIcon, GithubIcon, CatalogIcon, PencilAltIcon, UploadIcon, TrashIcon } from '@patternfly/react-icons';

const InstructLabLogo: React.FC = () => <Image src="/InstructLab-LogoFile-RGB-FullColor.svg" alt="InstructLab Logo" width={256} height={256} />;

const DashboardNative: React.FunctionComponent = () => {
  const [branches, setBranches] = React.useState<{ name: string; creationDate: number; message: string; author: string }[]>([]);
  const [taxonomyRepoDir, setTaxonomyRepoDir] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mergeStatus] = React.useState<{ branch: string; message: string; success: boolean } | null>(null);
  const [diffData, setDiffData] = React.useState<{ branch: string; changes: { file: string; status: string }[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [alerts, setAlerts] = React.useState<Partial<AlertProps>[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const getUniqueId = () => new Date().getTime();

  const router = useRouter();

  // Fetch branches from the API route
  React.useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      const taxonomyRepoDir = path.join(envConfig.TAXONOMY_ROOT_DIR + '/taxonomy');
      setTaxonomyRepoDir(taxonomyRepoDir);
    };
    getEnvVariables();

    cloneNativeTaxonomyRepo().then((success) => {
      if (success) {
        fetchBranches();
      }
    });
  }, []);

  const addAlert = (title: string, variant: AlertProps['variant'], key: React.Key) => {
    setAlerts((prevAlerts) => [...prevAlerts, { title, variant, key }]);
  };

  const removeAlert = (key: React.Key) => {
    setAlerts((prevAlerts) => [...prevAlerts.filter((alert) => alert.key !== key)]);
  };

  const addSuccessAlert = (message: string) => {
    addAlert(message, 'success', getUniqueId());
  };

  const addDangerAlert = (message: string) => {
    addAlert(message, 'danger', getUniqueId());
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/native/git/branches');
      const result = await response.json();
      if (response.ok) {
        // Filter out 'main' branch
        const filteredBranches = result.branches.filter((branch: { name: string }) => branch.name !== 'main');
        setBranches(filteredBranches);
      } else {
        console.error('Failed to fetch branches:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  async function cloneNativeTaxonomyRepo(): Promise<boolean> {
    try {
      const response = await fetch('/api/native/clone-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
        console.log(result.message);
        return true;
      } else {
        console.error(result.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error cloning repo:', errorMessage);
      return false;
    }
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleShowChanges = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'diff' })
      });

      const result = await response.json();
      if (response.ok) {
        setDiffData({ branch: branchName, changes: result.changes });
        setIsModalOpen(true);
      } else {
        console.error('Failed to get branch changes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branch changes:', error);
    }
  };

  const handleDeleteContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteContributionConfirm = async () => {
    if (selectedBranch) {
      await deleteContribution(selectedBranch);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteContributionCancel = () => {
    setSelectedBranch(null);
    setIsDeleteModalOpen(false);
  };

  const deleteContribution = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'delete' })
      });

      const result = await response.json();
      if (response.ok) {
        // Remove the branch from the list
        setBranches((prevBranches) => prevBranches.filter((branch) => branch.name !== branchName));
        addSuccessAlert(result.message);
      } else {
        console.error(result.error);
        addDangerAlert(result.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = 'Error deleting branch ' + branchName + ':' + error.message;
        console.error(errorMessage);
        addDangerAlert(errorMessage);
      } else {
        console.error('Unknown error deleting the contribution ${branchName}');
        addDangerAlert('Unknown error deleting the contribution ${branchName}');
      }
    }
  };

  const handleEditContribution = (branchName: string) => {
    setSelectedBranch(branchName);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false); // Close the modal when needed
  };

  const handlePublishContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsPublishModalOpen(true);
  };

  const handlePublishContributionConfirm = async () => {
    setIsPublishing(true);
    if (selectedBranch) {
      try {
        const response = await fetch('/api/native/git/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName: selectedBranch, action: 'publish' })
        });

        const result = await response.json();
        if (response.ok) {
          addSuccessAlert(result.message);
        } else {
          console.error('Failed to publish the contribution:', result.error);
          addDangerAlert(`Failed to publish the contribution:', ${result.error}`);
        }
      } catch (error) {
        console.error('Error while publishing the contribution:', error);
        addDangerAlert(`Error while publishing the contribution: ${error}`);
      }
    } else {
      addDangerAlert('No branch selected to publish');
    }
    setIsPublishing(false);
    setSelectedBranch(null);
    setIsPublishModalOpen(false);
  };

  const handlePublishContributionCancel = () => {
    setSelectedBranch(null);
    setIsPublishModalOpen(false);
  };

  return (
    <div>
      <PageBreadcrumb hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection hasBodyWrapper={false} style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="lg">
          My Submissions
        </Title>
        <Content>
          View and manage your taxonomy contributions.
          <Popover
            aria-label="Basic popover"
            bodyContent={
              <div>
                Taxonomy contributions help tune the InstructLab model. Contributions can include skills that teach the model how to do something or
                knowledge that teaches the model facts, data, or references.{' '}
                <a href="https://docs.instructlab.ai" target="_blank" rel="noopener noreferrer">
                  Learn more<ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
                </a>
              </div>
            }
          >
            <Button variant="plain" aria-label="more information">
              <OutlinedQuestionCircleIcon />
            </Button>
          </Popover>
        </Content>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <AlertGroup isToast isLiveRegion>
          {alerts.map(({ key, variant, title }) => (
            <Alert
              variant={AlertVariant[variant!]}
              title={title}
              timeout={true}
              actionClose={<AlertActionCloseButton title={title as string} variantLabel={`${variant} alert`} onClose={() => removeAlert(key!)} />}
              key={key}
            />
          ))}
        </AlertGroup>
        {isLoading ? (
          <Spinner size="lg" />
        ) : branches.length === 0 ? (
          <EmptyState headingLevel="h4" titleText="Welcome to InstructLab" icon={InstructLabLogo}>
            <EmptyStateBody>
              <div style={{ maxWidth: '60ch' }}>
                InstructLab is a powerful and accessible tool for advancing generative AI through community collaboration and open-source principles.
                By contributing your own data, you can help train and refine the language model. <br />
                <br />
                To get started, contribute a skill or contribute knowledge.
              </div>
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={() => router.push('/contribute/skill/')}>
                  Contribute Skill
                </Button>
                <Button variant="primary" onClick={() => router.push('/contribute/knowledge/')}>
                  Contribute Knowledge
                </Button>
                <Button variant="primary" onClick={() => router.push('/playground/chat')}>
                  Chat with the Models
                </Button>
              </EmptyStateActions>
              <EmptyStateActions>
                <Button
                  variant="link"
                  icon={<GithubIcon />}
                  iconPosition="right"
                  component="a"
                  href="https://github.com/instructlab"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the Project on Github
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        ) : (
          <Stack hasGutter>
            {branches.map((branch) => (
              <StackItem key={branch.name}>
                <Card>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>
                        Branch Name: {branch.name}
                        <br />
                        Contribution Title: <b>{branch.message}</b>
                        <br />
                        Author: {branch.author} {'    '}
                        Created on: {formatDateTime(branch.creationDate)}
                      </FlexItem>
                      <FlexItem align={{ default: 'alignRight' }}>
                        <Tooltip aria="none" aria-live="polite" content={<div>Show Changes</div>}>
                          <Button icon={<CatalogIcon />} variant="plain" aria-label="show" onClick={() => handleShowChanges(branch.name)} />
                        </Tooltip>
                        <Tooltip aria="none" aria-live="polite" content={<div>Edit Contribution</div>}>
                          <Button icon={<PencilAltIcon />} variant="plain" aria-label="edit" onClick={() => handleEditContribution(branch.name)} />
                        </Tooltip>
                        <Tooltip aria="none" aria-live="polite" content={<div>Publish Changes</div>}>
                          <Button icon={<UploadIcon />} variant="plain" aria-label="publish" onClick={() => handlePublishContribution(branch.name)} />
                        </Tooltip>
                        <Tooltip aria="none" aria-live="polite" content={<div>Delete</div>}>
                          <Button icon={<TrashIcon />} variant="plain" aria-label="delete" onClick={() => handleDeleteContribution(branch.name)} />
                        </Tooltip>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </StackItem>
            ))}
          </Stack>
        )}

        {mergeStatus && (
          <PageSection hasBodyWrapper={false}>
            <p style={{ color: mergeStatus.success ? 'green' : 'red' }}>{mergeStatus.message}</p>
          </PageSection>
        )}

        <Modal
          variant={ModalVariant.medium}
          title={`Changes in ${diffData?.branch} compared to main`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          aria-labelledby="changes-contribution-modal-title"
          aria-describedby="changes-contribution-body-variant"
        >
          <ModalHeader title={`Changes in ${diffData?.branch} compared to main`} labelId="changes-contribution-modal-title" titleIconVariant="info" />
          <ModalBody id="changes-contribution-body-variant">
            {diffData?.changes.length ? (
              <ul>
                {diffData.changes.map((change) => (
                  <li key={change.file}>
                    {change.file} - <strong>{change.status}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No differences found.</p>
            )}

          </ModalBody>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          title="Edit Contribution"
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          aria-labelledby="edit-contribution-modal-title"
          aria-describedby="edit-contribution-body-variant"
        >
          <ModalHeader title="Edit Contribution" labelId="edit-contribution-modal-title" titleIconVariant="info" />
          <ModalBody id="edit-contribution-body-variant">
            <p>Not yet implemented for native mode.</p>
          </ModalBody>
          <ModalFooter >
            <Button key="close" variant="primary" onClick={closeEditModal}>
              Close
            </Button>
          </ModalFooter>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          title="Deleting Contribution"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          aria-labelledby="delete-contribution-modal-title"
          aria-describedby="delete-contribution-body-variant"
        >
          <ModalHeader title="Deleting Contribution" labelId="delete-contribution-modal-title" titleIconVariant="warning" />
          <ModalBody id="delete-contribution-body-variant">
            <p>are you sure you want to delete this contribution?</p>
          </ModalBody>
          <ModalFooter >
            <Button key="confirm" variant="primary" onClick={() => handleDeleteContributionConfirm()}>
              Delete
            </Button>,
            <Button key="cancel" variant="secondary" onClick={() => handleDeleteContributionCancel()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          title="Publishing Contribution"
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          aria-labelledby="publish-contribution-modal-title"
          aria-describedby="publish-contribution-body-variant"
        >
          <ModalHeader title="Publishing Contribution" labelId="publish-contribution-modal-title" titleIconVariant="warning" />
          <ModalBody id="publish-contribution-body-variant">
            <p>are you sure you want to publish contribution to remote taxonomy repository present at : {taxonomyRepoDir}?</p>
          </ModalBody>
          <ModalFooter >
            <Button key="confirm" variant="primary" onClick={() => handlePublishContributionConfirm()}>
              Publish {'  '}
              {isPublishing && <Spinner isInline aria-label="Publishing contribution" />}
            </Button>,
            <Button key="cancel" variant="secondary" onClick={() => handlePublishContributionCancel()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

      </PageSection>
    </div>
  );
};

export { DashboardNative };
