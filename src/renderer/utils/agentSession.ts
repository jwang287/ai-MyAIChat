const SESSION_TOPIC_PREFIX = 'agent-session:'

export const buildAgentFileWorkspaceKey = (workspaceId?: string | null, workspacePath?: string): string => {
  return `${workspaceId ?? ''}\0${workspacePath ?? ''}`
}

export const buildAgentSessionTopicId = (sessionId: string): string => {
  return `${SESSION_TOPIC_PREFIX}${sessionId}`
}

export const extractAgentSessionIdFromTopicId = (topicId: string): string => {
  return topicId.replace(SESSION_TOPIC_PREFIX, '')
}
