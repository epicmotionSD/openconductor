import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  AgentRegistered,
  AgentUpdated,
  TrustScoreUpdated,
  TierUpgraded,
  AttestationAdded,
  AgentDeactivated,
  AgentReactivated
} from "../generated/ERC8004Registry/ERC8004"
import { Agent, Attestation, RegistryStats, DailyStats } from "../generated/schema"

function getOrCreateStats(): RegistryStats {
  let stats = RegistryStats.load("stats")
  if (stats == null) {
    stats = new RegistryStats("stats")
    stats.totalAgents = BigInt.fromI32(0)
    stats.activeAgents = BigInt.fromI32(0)
    stats.totalAttestations = BigInt.fromI32(0)
    stats.lastUpdated = BigInt.fromI32(0)
  }
  return stats
}

function getOrCreateDailyStats(timestamp: BigInt): DailyStats {
  let dayTimestamp = timestamp.div(BigInt.fromI32(86400)).times(BigInt.fromI32(86400))
  let id = dayTimestamp.toString()
  let daily = DailyStats.load(id)
  if (daily == null) {
    daily = new DailyStats(id)
    daily.date = dayTimestamp
    daily.registrations = BigInt.fromI32(0)
    daily.attestations = BigInt.fromI32(0)
  }
  return daily
}

export function handleAgentRegistered(event: AgentRegistered): void {
  let tokenId = event.params.agentId
  let agent = new Agent(tokenId.toString())
  
  agent.tokenId = tokenId
  agent.owner = event.params.registrant
  agent.metadataURI = event.params.metadataURI
  agent.trustScore = 1
  agent.verificationTier = 0
  agent.isActive = true
  agent.registeredAt = event.block.timestamp
  agent.registeredBlock = event.block.number
  agent.updatedAt = event.block.timestamp
  agent.attestationCount = 0
  agent.save()

  let stats = getOrCreateStats()
  stats.totalAgents = stats.totalAgents.plus(BigInt.fromI32(1))
  stats.activeAgents = stats.activeAgents.plus(BigInt.fromI32(1))
  stats.lastUpdated = event.block.timestamp
  stats.save()

  let daily = getOrCreateDailyStats(event.block.timestamp)
  daily.registrations = daily.registrations.plus(BigInt.fromI32(1))
  daily.save()
}

export function handleAgentUpdated(event: AgentUpdated): void {
  let agent = Agent.load(event.params.agentId.toString())
  if (agent != null) {
    agent.metadataURI = event.params.metadataURI
    agent.updatedAt = event.block.timestamp
    agent.save()
  }
}

export function handleTrustScoreUpdated(event: TrustScoreUpdated): void {
  let agent = Agent.load(event.params.agentId.toString())
  if (agent != null) {
    agent.trustScore = event.params.newScore
    agent.updatedAt = event.block.timestamp
    agent.save()
  }
}

export function handleTierUpgraded(event: TierUpgraded): void {
  let agent = Agent.load(event.params.agentId.toString())
  if (agent != null) {
    agent.verificationTier = event.params.newTier
    agent.updatedAt = event.block.timestamp
    agent.save()
  }
}

export function handleAttestationAdded(event: AttestationAdded): void {
  let agentId = event.params.agentId
  let verifier = event.params.verifier
  
  let attestationId = agentId.toString() + "-" + verifier.toHexString() + "-" + event.block.timestamp.toString()
  let attestation = new Attestation(attestationId)
  
  attestation.agent = agentId.toString()
  attestation.attestor = verifier
  attestation.attestorName = event.params.attestationType
  attestation.attestationURI = event.params.evidence
  attestation.createdAt = event.block.timestamp
  attestation.blockNumber = event.block.number
  attestation.save()

  let agent = Agent.load(agentId.toString())
  if (agent != null) {
    agent.attestationCount = agent.attestationCount + 1
    agent.updatedAt = event.block.timestamp
    agent.save()
  }

  let stats = getOrCreateStats()
  stats.totalAttestations = stats.totalAttestations.plus(BigInt.fromI32(1))
  stats.lastUpdated = event.block.timestamp
  stats.save()

  let daily = getOrCreateDailyStats(event.block.timestamp)
  daily.attestations = daily.attestations.plus(BigInt.fromI32(1))
  daily.save()
}

export function handleAgentDeactivated(event: AgentDeactivated): void {
  let agent = Agent.load(event.params.agentId.toString())
  if (agent != null) {
    agent.isActive = false
    agent.updatedAt = event.block.timestamp
    agent.save()

    let stats = getOrCreateStats()
    stats.activeAgents = stats.activeAgents.minus(BigInt.fromI32(1))
    stats.lastUpdated = event.block.timestamp
    stats.save()
  }
}

export function handleAgentReactivated(event: AgentReactivated): void {
  let agent = Agent.load(event.params.agentId.toString())
  if (agent != null) {
    agent.isActive = true
    agent.updatedAt = event.block.timestamp
    agent.save()

    let stats = getOrCreateStats()
    stats.activeAgents = stats.activeAgents.plus(BigInt.fromI32(1))
    stats.lastUpdated = event.block.timestamp
    stats.save()
  }
}
