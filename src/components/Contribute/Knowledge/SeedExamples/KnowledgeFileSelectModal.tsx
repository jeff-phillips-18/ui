// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KnowledgeSeedExample } from '@/types';
import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Switch,
  Spinner,
  Stack,
  StackItem,
  Card,
  CardHeader,
  CardBody,
  ExpandableSection,
  Content,
  ModalBody,
  Flex,
  FlexItem,
  Divider
} from '@patternfly/react-core';

interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate?: string;
}

const GITHUB_KNOWLEDGE_FILES_API = '/api/github/knowledge-files';
const NATIVE_GIT_KNOWLEDGE_FILES_API = '/api/native/git/knowledge-files';

interface Props {
  isGithubMode: boolean;
  seedExample: KnowledgeSeedExample;
  seedExampleIndex: number;
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  addDocumentInfo: (repositoryUrl: string, commitSha: string, docName: string) => void;
  repositoryUrl: string;
  commitSha: string;
  handleCloseModal: () => void;
}

const KnowledgeFileSelectModal: React.FC<Props> = ({
  isGithubMode,
  seedExampleIndex,
  handleContextInputChange,
  handleContextBlur,
  addDocumentInfo,
  repositoryUrl,
  commitSha,
  handleCloseModal
}) => {
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [selectedWordCount, setSelectedWordCount] = useState<number>(0);
  const [showAllCommits, setShowAllCommits] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchKnowledgeFiles = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(isGithubMode ? GITHUB_KNOWLEDGE_FILES_API : NATIVE_GIT_KNOWLEDGE_FILES_API, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        if (response.ok) {
          setKnowledgeFiles(result.files);
          console.log('Fetched knowledge files:', result.files);
        } else {
          setError(result.error || 'Failed to fetch knowledge files.');
          console.error('Error fetching knowledge files:', result.error);
        }
      } catch (err) {
        setError('An error occurred while fetching knowledge files.');
        console.error('Error fetching knowledge files:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeFiles();
  }, [isGithubMode]);

  // Ref for the <pre> elements to track selections TODO: figure out how to make text expansions taller in PF without a custom-pre
  const preRefs = useRef<Record<string, HTMLPreElement | null>>({});

  const LOCAL_TAXONOMY_DOCS_ROOT_DIR =
    `${process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR}/taxonomy-knowledge-docs` || `${process.env.HOME}/.instructlab-ui/taxonomy-knowledge-docs`;

  const handleUseSelectedText = (file: KnowledgeFile) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText) {
      alert('Please select the text you want to use as context.');
      return;
    }

    repositoryUrl = `${LOCAL_TAXONOMY_DOCS_ROOT_DIR}/${file.filename}`;
    const commitShaValue = file.commitSha;
    const docName = file.filename;

    console.log(
      `handleUseSelectedText: selectedText="${selectedText}", repositoryUrl=${repositoryUrl}, commitSha=${commitShaValue}, docName=${docName}`
    );

    handleContextInputChange(seedExampleIndex, selectedText);
    handleContextBlur(seedExampleIndex);
    addDocumentInfo(repositoryUrl, commitShaValue, docName);
    handleCloseModal();
  };

  const updateSelectedWordCount = (filename: string) => {
    const selection = window.getSelection();
    const preElement = preRefs.current[filename];
    if (selection && preElement) {
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;

      if (preElement.contains(anchorNode) && preElement.contains(focusNode)) {
        const selectedText = selection.toString().trim();
        const wordCount = selectedText.split(/\s+/).filter((word) => word.length > 0).length;
        setSelectedWordCount(wordCount);
      } else {
        setSelectedWordCount(0);
      }
    }
  };

  // Attach event listeners for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      // Iterate through all expanded files and update word count
      Object.keys(expandedFiles).forEach((filename) => {
        if (expandedFiles[filename]) {
          updateSelectedWordCount(filename);
        }
      });
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [expandedFiles]);

  const toggleFileContent = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename]
    }));
    console.log(`toggleFileContent: filename=${filename}, expanded=${!expandedFiles[filename]}`);
  };

  // Group files by commitSha
  const groupedFiles = knowledgeFiles.reduce<Record<string, KnowledgeFile[]>>((acc, file) => {
    if (!acc[file.commitSha]) {
      acc[file.commitSha] = [];
    }
    acc[file.commitSha].push(file);
    return acc;
  }, {});
  console.log(groupedFiles);

  // Extract commit dates for sorting
  const commitDateMap: Record<string, string> = React.useMemo(() => {
    const map: Record<string, string> = {};
    knowledgeFiles.forEach((file) => {
      if (file.commitDate && !map[file.commitSha]) {
        map[file.commitSha] = file.commitDate;
      }
    });
    return map;
  }, [knowledgeFiles]);

  // Enforce single commit SHA and repository URL
  const isSameCommit = (fileCommitSha: string): boolean => {
    if (!commitSha) {
      return true;
    }
    return fileCommitSha === commitSha;
  };

  // Determine which commits to display based on the toggle
  const commitsToDisplay = React.useMemo(() => {
    // Sort the commit SHAs based on commitDate in descending order (latest first)
    const sortedCommitShas = Object.keys(groupedFiles).sort((a, b) => {
      const dateA = new Date(commitDateMap[a] || '').getTime();
      const dateB = new Date(commitDateMap[b] || '').getTime();
      return dateB - dateA;
    });

    return showAllCommits ? sortedCommitShas : sortedCommitShas.slice(0, 1);
  }, [commitDateMap, groupedFiles, showAllCommits]);

  const setPreRef = useCallback(
    (filename: string) => (el: HTMLPreElement | null) => {
      preRefs.current[filename] = el;
    },
    []
  );

  // Update word count whenever context changes
  return (
    <Modal variant={ModalVariant.large} title="Select a Knowledge File" isOpen onClose={handleCloseModal} style={{ padding: '20px' }}>
      <ModalBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          {commitSha && (
            <FlexItem>
              <Alert
                variant="warning"
                isInline
                title="All knowledge files need to originate from the same commit or 'Document Information' submission"
              >
                A commit SHA (<strong>{commitSha}</strong>) has already been selected in a previous seed example. All subsequent selections must use
                the same commit SHA for consistency.
              </Alert>
            </FlexItem>
          )}
          <FlexItem>
            <Alert variant="info" isInline title="Instructions">
              Please highlight up to 500 words and click the &quot;Use Selected Text For Context&quot; button to populate the context field. Knowledge
              context must be verbatim from the knowledge file by selecting the text. Multiple files can be used for context selection, but they must
              belong to the same commit (SHA).
            </Alert>
          </FlexItem>
          <FlexItem>
            <Switch
              label="Show All Knowledge Files"
              // labelOff="Show Only Most Recent Commit"
              isChecked={showAllCommits}
              onChange={() => setShowAllCommits(!showAllCommits)}
              id="show-all-commits-toggle"
            />
          </FlexItem>
          <FlexItem>
            {isLoading ? (
              <FlexItem>
                <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <Spinner size="md" />
                  </FlexItem>
                  <FlexItem>Loading knowledge files and their commits...</FlexItem>
                </Flex>
              </FlexItem>
            ) : (
              <>
                {error ? (
                  <Alert variant="danger" title="Error" isInline>
                    {error}
                  </Alert>
                ) : knowledgeFiles.length === 0 ? (
                  <span>No knowledge files available.</span>
                ) : (
                  <Stack hasGutter>
                    {commitsToDisplay.map((commitShaKey) => {
                      const files = groupedFiles[commitShaKey];
                      const isSelectable = isSameCommit(commitShaKey);
                      const commitDate = commitDateMap[commitShaKey];
                      const formattedDate = commitDate ? new Date(commitDate).toLocaleString() : 'Unknown date';

                      // Highlight the card if commitShaKey matches currently selected commitSha
                      const highlightCard = !!commitSha && commitShaKey === commitSha;

                      return (
                        <StackItem key={commitShaKey}>
                          <Card selected={highlightCard}>
                            <CardHeader>
                              <strong>Commit SHA:</strong> {commitShaKey} <br />
                              <strong>Date:</strong> {formattedDate}
                            </CardHeader>
                            <CardBody>
                              <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
                                {files.map((file, index) => (
                                  <>
                                    {index > 0 ? <Divider /> : null}
                                    <FlexItem key={file.filename}>
                                      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                                        <FlexItem>
                                          <Flex
                                            justifyContent={{ default: 'justifyContentSpaceBetween' }}
                                            alignItems={{ default: 'alignItemsCenter' }}
                                            gap={{ default: 'gapMd' }}
                                          >
                                            <FlexItem style={{ fontWeight: 'bold' }}>{file.filename}</FlexItem>
                                            <FlexItem>
                                              <Button variant="link" onClick={() => toggleFileContent(file.filename)} isDisabled={!isSelectable}>
                                                {expandedFiles[file.filename] ? 'Hide' : 'Show'} Contents for Context Selection
                                              </Button>
                                            </FlexItem>
                                          </Flex>
                                        </FlexItem>
                                        {expandedFiles[file.filename] && (
                                          <FlexItem>
                                            <ExpandableSection
                                              toggleText={expandedFiles[file.filename] ? 'Hide file contents' : 'Show file contents'}
                                              onToggle={() => toggleFileContent(file.filename)}
                                              isExpanded={expandedFiles[file.filename]}
                                            >
                                              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                                                <FlexItem>
                                                  <pre
                                                    ref={setPreRef(file.filename)}
                                                    style={{
                                                      whiteSpace: 'pre-wrap',
                                                      wordBreak: 'break-word',
                                                      backgroundColor: '#f5f5f5',
                                                      padding: '10px',
                                                      borderRadius: '4px',
                                                      maxHeight: '700px',
                                                      overflowY: 'auto',
                                                      userSelect: 'text'
                                                    }}
                                                  >
                                                    {file.content}
                                                  </pre>
                                                </FlexItem>
                                                <FlexItem>
                                                  <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                                                    <FlexItem>
                                                      <Button
                                                        variant="primary"
                                                        onClick={() => handleUseSelectedText(file)}
                                                        isDisabled={selectedWordCount === 0 || selectedWordCount > 500} // Disable if word count exceeds 500
                                                      >
                                                        Use Selected Text For Context
                                                      </Button>
                                                    </FlexItem>
                                                    <FlexItem>
                                                      <Content
                                                        component="small"
                                                        style={{
                                                          fontWeight: 'bold',
                                                          color: selectedWordCount > 500 ? 'red' : 'green'
                                                        }}
                                                      >
                                                        {selectedWordCount}/500 words selected
                                                      </Content>
                                                    </FlexItem>
                                                  </Flex>
                                                </FlexItem>
                                              </Flex>
                                            </ExpandableSection>
                                          </FlexItem>
                                        )}
                                      </Flex>
                                    </FlexItem>
                                  </>
                                ))}
                              </Flex>
                            </CardBody>
                          </Card>
                        </StackItem>
                      );
                    })}
                  </Stack>
                )}
              </>
            )}
          </FlexItem>
        </Flex>
      </ModalBody>
    </Modal>
  );
};

export default KnowledgeFileSelectModal;
