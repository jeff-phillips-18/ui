// src/components/Contribute/Knowledge/Github/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import '../knowledge.css';
import { useSession } from 'next-auth/react';
import DocumentInformation from '@/components/Contribute/Knowledge/DocumentInformation/DocumentInformation';
import SeedExamples from '@/components/Contribute/Knowledge/SeedExamples/SeedExamples';
import { KnowledgeEditFormData, KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { useRouter } from 'next/navigation';
import { autoFillKnowledgeFields } from '@/components/Contribute/Knowledge/AutoFill';
import ReviewSubmission from '../ReviewSubmission';
import { YamlFileUploadModal } from '../../YamlFileUploadModal';
import {
  ValidatedOptions,
  PageGroup,
  PageBreadcrumb,
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Flex,
  FlexItem,
  Title,
  Button,
  Content,
  Wizard,
  WizardStep,
  Truncate
} from '@patternfly/react-core';
import { devLog } from '@/utils/devlog';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import KnowledgeWizardFooter from '@/components/Contribute/Knowledge/KnowledgeWizardFooter/KnowledgeWizardFooter';
import { addDocumentInfoToKnowledgeFormData } from '@/components/Contribute/Knowledge/documentUtils';
import { addYamlUploadKnowledge } from '@/components/Contribute/Knowledge/uploadUtils';
import { createEmptySeedExample } from '@/components/Contribute/Knowledge/seedExampleUtils';
import {
  isDocumentInfoValid,
  isKnowledgeDetailsValid,
  isSeedExamplesValid
} from '@/components/Contribute/Knowledge/validationUtils';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import {
  submitGithubKnowledgeData,
  submitNativeKnowledgeData,
  updateGithubKnowledgeData,
  updateNativeKnowledgeData
} from '@/components/Contribute/Knowledge/submitUtils';
import { getGitHubUserInfo } from '@/utils/github';
import AttributionInformation from '@/components/Contribute/Knowledge/AttributionInformation/AttributionInformation';
import KnowledgeDetailsPage from '@/components/Contribute/Knowledge/KnowledgeDetailsPage/KnowledgeDetailsPage';

const DefaultKnowledgeFormData: KnowledgeFormData = {
  email: '',
  name: '',
  submissionSummary: '',
  domain: '',
  documentOutline: '',
  filePath: '',
  seedExamples: [createEmptySeedExample(), createEmptySeedExample(), createEmptySeedExample(), createEmptySeedExample(), createEmptySeedExample()],
  knowledgeDocumentRepositoryUrl: '',
  knowledgeDocumentCommit: '',
  documentName: '',
  titleWork: '',
  linkWork: '',
  revision: '',
  licenseWork: '',
  creators: ''
};

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
  isGithubMode: boolean;
}

const STEP_IDS = [
  'details',
  'resource-documentation',
  'uploaded-documents',
  'attributions',
  'seed-data',
  'seed-context',
  'question-answer-pairs',
  'review'
];

const getStepIndex = (stepId: string) => STEP_IDS.indexOf(stepId);

enum StepStatus {
  Default = 'default',
  Error = 'error',
  Success = 'success'
}

interface StepType {
  id: string;
  name: string;
  component?: React.ReactNode;
  subSteps?: {
    id: string;
    name: string;
    component?: React.ReactNode;
    status?: StepStatus;
  }[];
  status?: StepStatus;
}

export const KnowledgeWizard: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData, isGithubMode }) => {
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | undefined>();
  const { data: session } = useSession();
  const [knowledgeFormData, setKnowledgeFormData] = React.useState<KnowledgeFormData>(
    knowledgeEditFormData?.knowledgeFormData || DefaultKnowledgeFormData
  );
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false); // **New State Added**
  const [submitEnabled, setSubmitEnabled] = useState<boolean>(false); // **New State Added**
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const router = useRouter();

  useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDevModeEnabled(envConfig.ENABLE_DEV_MODE === 'true');
    };
    getEnvVariables();
  }, []);

  useEffect(() => {
    let canceled = false;

    if (isGithubMode) {
      const fetchUserInfo = async () => {
        if (session?.accessToken) {
          try {
            const headers = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28'
            };
            const fetchedUserInfo = await getGitHubUserInfo(headers);
            if (!canceled) {
              setGithubUsername(fetchedUserInfo.login);
              setKnowledgeFormData((prev) => ({
                ...prev,
                name: fetchedUserInfo.name,
                email: fetchedUserInfo.email
              }));
            }
          } catch (error) {
            console.error('Failed to fetch GitHub user info:', error);
          }
        }
      };
      fetchUserInfo();
    } else {
      setKnowledgeFormData((prev) => ({
        ...prev,
        name: session?.user?.name ? session.user.name : prev.name,
        email: session?.user?.email ? session.user.email : prev.email
      }));
    }

    return () => {
      canceled = true;
    };
  }, [isGithubMode, session?.accessToken, session?.user?.name, session?.user?.email]);

  useEffect(() => {
    // Set all elements from the knowledgeFormData to the state
    if (knowledgeEditFormData) {
      setKnowledgeFormData({
        ...knowledgeEditFormData.knowledgeFormData,
        seedExamples: knowledgeEditFormData.knowledgeFormData.seedExamples.map((example) => ({
          ...example,
          immutable: example.immutable !== undefined ? example.immutable : true, // Ensure immutable is set
          isContextValid: example.isContextValid || ValidatedOptions.default,
          validationError: example.validationError || '',
          questionAndAnswers: example.questionAndAnswers.map((qa) => ({
            ...qa,
            immutable: qa.immutable !== undefined ? qa.immutable : true, // Ensure immutable is set
            isQuestionValid: qa.isQuestionValid || ValidatedOptions.default,
            questionValidationError: qa.questionValidationError || '',
            isAnswerValid: qa.isAnswerValid || ValidatedOptions.default,
            answerValidationError: qa.answerValidationError || ''
          }))
        }))
      });

      devLog('Seed Examples Set from Edit Form Data:', knowledgeEditFormData.knowledgeFormData.seedExamples);
    }
  }, [knowledgeEditFormData]);

  // Function to append document information (Updated for single repositoryUrl and commitSha)
  // Within src/components/Contribute/Native/index.tsx
  const addDocumentInfoHandler = React.useCallback(
    (repoUrl: string, commitShaValue: string, docName: string) => {
      devLog(`addDocumentInfoHandler: repoUrl=${repoUrl}, commitSha=${commitShaValue}, docName=${docName}`);
      if (knowledgeFormData.knowledgeDocumentCommit && commitShaValue !== knowledgeFormData.knowledgeDocumentCommit) {
        console.error('Cannot add documents from different commit SHAs.');
        setActionGroupAlertContent({
          title: 'Invalid Selection',
          message: 'All documents must be from the same commit SHA.',
          success: false
        });
        return;
      }
      setKnowledgeFormData((prev) => addDocumentInfoToKnowledgeFormData(prev, repoUrl, commitShaValue, docName));
    },
    [knowledgeFormData.knowledgeDocumentCommit]
  );

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const autoFillForm = (): void => {
    setKnowledgeFormData({
      ...autoFillKnowledgeFields,
      knowledgeDocumentRepositoryUrl: '~/.instructlab-ui/taxonomy-knowledge-docs'
    });
  };
  const onYamlUploadKnowledgeFillForm = (data: KnowledgeYamlData): void => {
    setKnowledgeFormData((prev) => addYamlUploadKnowledge(prev, data));
    setActionGroupAlertContent({
      title: 'YAML Uploaded Successfully',
      message: 'Your knowledge form has been populated based on the uploaded YAML file.',
      success: true
    });
  };

  useEffect(() => {
    devLog('Seed Examples Updated:', knowledgeFormData.seedExamples);
  }, [knowledgeFormData.seedExamples]);

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const steps: StepType[] = React.useMemo(() => {
    const documentInformationStep = {
      id: STEP_IDS[2],
      name: 'Upload documents',
      component: (
        <DocumentInformation
          isGithubMode={isGithubMode}
          isEditForm={knowledgeEditFormData?.isEditForm}
          knowledgeDocumentRepositoryUrl={knowledgeFormData.knowledgeDocumentRepositoryUrl}
          setKnowledgeDocumentRepositoryUrl={(knowledgeDocumentRepositoryUrl) =>
            setKnowledgeFormData((prev) => ({ ...prev, knowledgeDocumentRepositoryUrl }))
          }
          knowledgeDocumentCommit={knowledgeFormData.knowledgeDocumentCommit}
          setKnowledgeDocumentCommit={(knowledgeDocumentCommit) =>
            setKnowledgeFormData((prev) => ({
              ...prev,
              knowledgeDocumentCommit
            }))
          }
          documentName={knowledgeFormData.documentName}
          setDocumentName={(documentName) =>
            setKnowledgeFormData((prev) => ({
              ...prev,
              documentName
            }))
          }
        />
      ),
      status: isDocumentInfoValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
    };

    return [
      {
        id: STEP_IDS[0],
        name: 'Details',
        component: (
          <KnowledgeDetailsPage
            isGithubMode={isGithubMode}
            isEditForm={!!knowledgeEditFormData?.isEditForm}
            email={knowledgeFormData.email}
            setEmail={(email) => setKnowledgeFormData((prev) => ({ ...prev, email }))}
            name={knowledgeFormData.name}
            setName={(name) => setKnowledgeFormData((prev) => ({ ...prev, name }))}
            submissionSummary={knowledgeFormData.submissionSummary}
            setSubmissionSummary={(submissionSummary) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                submissionSummary
              }))
            }
            filePath={knowledgeFormData.filePath}
            setFilePath={(filePath) => setKnowledgeFormData((prev) => ({ ...prev, filePath }))}
          />
        ),
        status: isKnowledgeDetailsValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      ...(isGithubMode
        ? [
            {
              id: STEP_IDS[1],
              name: 'Resource documentation',
              isExpandable: true,
              subSteps: [
                documentInformationStep,
                {
                  id: STEP_IDS[3],
                  name: 'Attribution details',
                  component: (
                    <AttributionInformation
                      isEditForm={knowledgeEditFormData?.isEditForm}
                      knowledgeFormData={knowledgeFormData}
                      titleWork={knowledgeFormData.titleWork}
                      setTitleWork={(titleWork) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          titleWork
                        }))
                      }
                      linkWork={knowledgeFormData.linkWork}
                      setLinkWork={(linkWork) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          linkWork
                        }))
                      }
                      revision={knowledgeFormData.revision}
                      setRevision={(revision) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          revision
                        }))
                      }
                      licenseWork={knowledgeFormData.licenseWork}
                      setLicenseWork={(licenseWork) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          licenseWork
                        }))
                      }
                      creators={knowledgeFormData.creators}
                      setCreators={(creators) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          creators
                        }))
                      }
                    />
                  )
                }
              ]
            }
          ]
        : [documentInformationStep]),
      {
        id: STEP_IDS[4],
        name: 'Create seed data',
        subSteps: [
          {
            id: STEP_IDS[5],
            name: 'Select context',
            component: (
              <SeedExamples
                isGithubMode={isGithubMode}
                seedExamples={knowledgeFormData.seedExamples}
                onUpdateSeedExamples={(seedExamples) =>
                  setKnowledgeFormData((prev) => ({
                    ...prev,
                    seedExamples
                  }))
                }
                addDocumentInfo={addDocumentInfoHandler}
                repositoryUrl={knowledgeFormData.knowledgeDocumentRepositoryUrl}
                commitSha={knowledgeFormData.knowledgeDocumentCommit}
              />
            ),
            status: isSeedExamplesValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
          },
          {
            id: STEP_IDS[6],
            name: 'Create Q&A pairs',
            component: (
              <SeedExamples
                isGithubMode={isGithubMode}
                seedExamples={knowledgeFormData.seedExamples}
                onUpdateSeedExamples={(seedExamples) =>
                  setKnowledgeFormData((prev) => ({
                    ...prev,
                    seedExamples
                  }))
                }
                addDocumentInfo={addDocumentInfoHandler}
                repositoryUrl={knowledgeFormData.knowledgeDocumentRepositoryUrl}
                commitSha={knowledgeFormData.knowledgeDocumentCommit}
              />
            ),
            status: isSeedExamplesValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
          }
        ],
        status: isSeedExamplesValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[7],
        name: 'Review',
        component: <ReviewSubmission knowledgeFormData={knowledgeFormData} isGithubMode={isGithubMode} />,
        status: StepStatus.Default
      }
    ];
  }, [addDocumentInfoHandler, isGithubMode, knowledgeEditFormData?.isEditForm, knowledgeFormData]);

  useEffect(() => {
    setSubmitEnabled(!steps.find((step) => step.status === 'error'));
  }, [steps]);

  const handleSubmit = async (): Promise<boolean> => {
    if (knowledgeEditFormData) {
      const result = isGithubMode
        ? await updateGithubKnowledgeData(session, knowledgeFormData, knowledgeEditFormData, setActionGroupAlertContent)
        : await updateNativeKnowledgeData(knowledgeFormData, knowledgeEditFormData, setActionGroupAlertContent);
      if (result) {
        router.push('/dashboard');
      }
      return false;
    }
    const result = isGithubMode
      ? await submitGithubKnowledgeData(knowledgeFormData, githubUsername, setActionGroupAlertContent)
      : await submitNativeKnowledgeData(knowledgeFormData, setActionGroupAlertContent);
    if (result) {
      setKnowledgeFormData(DefaultKnowledgeFormData);
    }
    return result;
  };

  return (
    <PageGroup>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Knowledge Contribution</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection className="knowledge-form" isFilled>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10px' }}>
                  Knowledge Contribution
                </Title>
              </FlexItem>
              <FlexItem>
                {devModeEnabled && (
                  <Button variant="secondary" onClick={autoFillForm}>
                    Auto-Fill
                  </Button>
                )}
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Content component="p">
              Knowledge consists of data and facts and is backed by reference documents. When you contribute knowledge, you provide the documents and
              a collection of questions and answers; this new data is used by the model to answer questions more accurately. The contribution form
              guides you through the process, or you can{' '}
              <Button isInline variant="link" onClick={() => setIsYamlModalOpen(true)}>
                upload an existing yaml file.
              </Button>
            </Content>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Wizard
              height={600}
              startIndex={1}
              onClose={handleCancel}
              onStepChange={(_ev, currentStep) => setActiveStepIndex(STEP_IDS.indexOf(String(currentStep.id)))}
              footer={
                <KnowledgeWizardFooter
                  onCancel={handleCancel}
                  knowledgeFormData={knowledgeFormData}
                  isGithubMode={isGithubMode}
                  onSubmit={handleSubmit}
                  isValid={true}
                  showSubmit={submitEnabled}
                  isEdit={!!knowledgeEditFormData}
                />
              }
            >
              {steps.map((step) => (
                <WizardStep
                  key={step.id}
                  isExpandable={!!step.subSteps}
                  id={step.id}
                  name={step.name}
                  navItem={{ content: <Truncate content={step.name} /> }}
                  status={getStepIndex(step.id) < activeStepIndex ? step.status : StepStatus.Default}
                  steps={
                    step.subSteps
                      ? step.subSteps.map((subStep) => (
                          <WizardStep
                            key={subStep.id}
                            id={subStep.id}
                            name={subStep.name}
                            navItem={{ content: <Truncate content={subStep.name} /> }}
                            status={subStep.status === StepStatus.Error && getStepIndex(subStep.id) >= activeStepIndex ? StepStatus.Default : subStep.status}
                          >
                            {subStep.component}
                          </WizardStep>
                        ))
                      : undefined
                  }
                >
                  {!step.subSteps ? step.component : null}
                </WizardStep>
              ))}
            </Wizard>
          </FlexItem>
        </Flex>

        <YamlFileUploadModal
          isModalOpen={isYamlModalOpen}
          setIsModalOpen={setIsYamlModalOpen}
          isKnowledgeForm={true}
          onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
          setActionGroupAlertContent={setActionGroupAlertContent}
        />

        <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={onCloseActionGroupAlert} />
      </PageSection>
    </PageGroup>
  );
};

export default KnowledgeWizard;
