/**
 * components/marketing/useGithubStats.ts
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Custom React hook to fetch real-time GitHub repository statistics.
 * Extracts the fetch logic from the monolithic page.tsx.
 * Handles errors gracefully — defaults to 0 if the API is unavailable.
 */

'use client'

import { useEffect, useState } from 'react'

export interface GithubStats {
  stars: number
  forks: number
  watchers: number
  downloads: {
    deb: number
    rpm: number
    tar: number
  }
}

const DEFAULT_STATS: GithubStats = {
  stars: 0,
  forks: 0,
  watchers: 0,
  downloads: { deb: 0, rpm: 0, tar: 0 }
}

const REPO = 'Alexglv2000/linux-market'

/**
 * Fetches star count, fork count and per-installer download counts from GitHub API.
 * Data is sourced from the most recent release's assets.
 *
 * @returns {GithubStats} — live stats, initializes to zeros
 */
export function useGithubStats(): GithubStats {
  const [stats, setStats] = useState<GithubStats>(DEFAULT_STATS)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch main repository metadata (stars, forks, watchers)
        const [repoRes, releasesRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${REPO}`),
          fetch(`https://api.github.com/repos/${REPO}/releases`)
        ])

        if (!repoRes.ok || !releasesRes.ok) return

        const repoData     = await repoRes.json()
        const releasesData = await releasesRes.json()

        let debCount = 0, rpmCount = 0, tarCount = 0

        // Count downloads per installer type from the latest release assets
        if (Array.isArray(releasesData) && releasesData.length > 0) {
          for (const asset of releasesData[0].assets ?? []) {
            if (asset.name.endsWith('.deb'))    debCount += asset.download_count
            if (asset.name.endsWith('.rpm'))    rpmCount += asset.download_count
            if (asset.name.endsWith('.tar.gz')) tarCount += asset.download_count
          }
        }

        setStats({
          stars:     repoData.stargazers_count   ?? 0,
          forks:     repoData.forks_count        ?? 0,
          watchers:  repoData.subscribers_count  ?? 0,
          downloads: { deb: debCount, rpm: rpmCount, tar: tarCount }
        })
      } catch {
        // Silently fail — stats will remain at default 0 values
        // The page still functions without network access
      }
    }

    fetchStats()
  }, [])

  return stats
}
