#!/usr/bin/env tsx

/**
 * Export Top 50 MCP servers for production deployment
 *
 * Criteria:
 * 1. Official Anthropic servers (highest priority)
 * 2. High GitHub stars
 * 3. Cover all major categories
 * 4. Popular search terms (postgres, github, slack, memory, etc.)
 */

import { db } from '../src/db/connection.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface Server {
  id: string;
  slug: string;
  name: string;
  description: string;
  repository_url: string;
  npm_package: string | null;
  category: string;
  tags: string[];
  github_stars: number;
}

async function exportTop50() {
  console.log('🔍 Finding top 50 MCP servers for production...\n');

  try {
    // Get all servers with stats
    const query = `
      SELECT
        s.id,
        s.slug,
        s.name,
        s.description,
        s.repository_url,
        s.npm_package,
        s.category,
        s.tags,
        COALESCE(st.github_stars, 0) as github_stars
      FROM mcp_servers s
      LEFT JOIN server_stats st ON s.id = st.server_id
      ORDER BY
        -- Prioritize official Anthropic servers
        CASE
          WHEN s.repository_url LIKE '%github.com/anthropics/%' THEN 0
          WHEN s.repository_url LIKE '%github.com/modelcontextprotocol/%' THEN 1
          ELSE 2
        END,
        -- Then by stars
        COALESCE(st.github_stars, 0) DESC,
        -- Then by name
        s.name ASC
      LIMIT 100
    `;

    const result = await db.query<Server>(query);
    const allServers = result.rows;

    console.log(`📊 Found ${allServers.length} servers total\n`);

    // Critical search terms that must be represented
    const criticalKeywords = [
      'postgres', 'postgresql', 'database',
      'github', 'git',
      'slack', 'discord', 'communication',
      'memory', 'openmemory',
      'filesystem', 'file',
      'snowflake', 'bigquery', 'analytics',
      'notion', 'obsidian',
      'brave', 'search', 'web',
      'google', 'drive', 'sheets',
      'aws', 'sagemaker',
      'cloudflare', 'supabase',
      'sequential', 'thinking',
      'fetch', 'http',
      'time', 'datetime',
      'sqlite', 'mysql'
    ];

    // Track coverage
    const keywordCoverage = new Map<string, Server[]>();
    criticalKeywords.forEach(k => keywordCoverage.set(k, []));

    // Categorize servers by keywords
    allServers.forEach(server => {
      const searchText = [
        server.name,
        server.slug,
        server.description,
        ...(server.tags || [])
      ].join(' ').toLowerCase();

      criticalKeywords.forEach(keyword => {
        if (searchText.includes(keyword.toLowerCase())) {
          keywordCoverage.get(keyword)!.push(server);
        }
      });
    });

    // Build Top 50 list
    const top50 = new Set<Server>();
    const addedIds = new Set<string>();

    // 1. Add all official servers first
    const officialServers = allServers.filter(s =>
      s.repository_url?.includes('github.com/anthropics/') ||
      s.repository_url?.includes('github.com/modelcontextprotocol/')
    );

    officialServers.forEach(s => {
      if (!addedIds.has(s.id)) {
        top50.add(s);
        addedIds.add(s.id);
      }
    });

    console.log(`✅ Added ${top50.size} official servers\n`);

    // 2. Ensure coverage of critical keywords (at least top 1 per keyword)
    criticalKeywords.forEach(keyword => {
      const matches = keywordCoverage.get(keyword)!;
      if (matches.length > 0 && !addedIds.has(matches[0].id)) {
        top50.add(matches[0]);
        addedIds.add(matches[0].id);
      }
    });

    console.log(`✅ Added keyword coverage, now have ${top50.size} servers\n`);

    // 3. Fill remaining slots with highest star servers
    const remainingSlots = 50 - top50.size;
    const remainingServers = allServers.filter(s => !addedIds.has(s.id));

    for (let i = 0; i < Math.min(remainingSlots, remainingServers.length); i++) {
      top50.add(remainingServers[i]);
      addedIds.add(remainingServers[i].id);
    }

    const top50Array = Array.from(top50);

    console.log(`\n🎯 Final count: ${top50Array.length} servers\n`);

    // Show keyword coverage
    console.log('📋 Keyword Coverage Report:');
    criticalKeywords.forEach(keyword => {
      const matches = top50Array.filter(s => {
        const searchText = [
          s.name,
          s.slug,
          s.description,
          ...(s.tags || [])
        ].join(' ').toLowerCase();
        return searchText.includes(keyword.toLowerCase());
      });

      const status = matches.length > 0 ? '✅' : '❌';
      console.log(`  ${status} ${keyword}: ${matches.length} server(s)`);
    });

    // Export to JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      count: top50Array.length,
      servers: top50Array.map(s => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        repository_url: s.repository_url,
        npm_package: s.npm_package,
        category: s.category,
        tags: s.tags,
        github_stars: s.github_stars
      }))
    };

    const outputPath = join(process.cwd(), 'top-50-servers.json');
    writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Exported to: ${outputPath}`);

    // Show top 10
    console.log('\n🏆 Top 10 servers:');
    top50Array.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name} (${s.slug}) - ⭐ ${s.github_stars}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

exportTop50();
