/** Verification orchestrator — routes posts to tweet_lookup or corroboration by postType. */

import {
  corroboratePost,
  type CorroborationResult,
  isXAIConfigured,
  type TweetVerificationResult,
  verifyTweet,
} from './xai-client';

// Types

export type VerificationOutcome = {
  status: 'VERIFIED' | 'FAILED' | 'PARTIAL' | 'SKIPPED' | 'UNVERIFIED';
  result: {
    strategy: 'tweet_lookup' | 'corroboration' | 'skipped' | 'not_configured';
    match?: string;
    confidence?: string;
    actualContent?: string;
    discrepancies?: string[];
    evidence?: string;
    grokResponse?: string;
  };
  citations: string[];
};

// Verification strategy router

/**
 * Verify a single X post based on its postType.
 *
 * Strategy:
 * - XPOST: Direct tweet verification via x_search. MUST pass.
 * - NEWS_ARTICLE: Corroboration via web_search.
 * - OFFICIAL_STATEMENT: Corroboration via x_search + web_search.
 * - PRESS_RELEASE: Corroboration via web_search.
 * - ANALYSIS: Skip — original analysis doesn't need verification.
 */
export async function verifyXPost(post: {
  tweetId?: string | null;
  postType: string;
  handle: string;
  content: string;
}): Promise<VerificationOutcome> {
  if (!isXAIConfigured()) {
    return {
      status: 'UNVERIFIED',
      result: { strategy: 'not_configured' },
      citations: [],
    };
  }

  const { postType } = post;

  if (postType === 'ANALYSIS') {
    return {
      status: 'SKIPPED',
      result: { strategy: 'skipped' },
      citations: [],
    };
  }

  // XPOST: Direct tweet verification
  if (postType === 'XPOST') {
    if (!post.tweetId) {
      return {
        status: 'FAILED',
        result: {
          strategy: 'tweet_lookup',
          match: 'not_found',
          discrepancies: ['No tweetId provided for XPOST'],
        },
        citations: [],
      };
    }

    const result: TweetVerificationResult = await verifyTweet(
      post.tweetId,
      post.handle,
      post.content,
    );

    if (!result.exists) {
      return {
        status: 'FAILED',
        result: {
          strategy: 'tweet_lookup',
          match: 'not_found',
          actualContent: result.actualContent,
          discrepancies: result.discrepancies ?? ['Tweet does not exist on X'],
          grokResponse: result.grokResponse,
        },
        citations: result.citations,
      };
    }

    if (result.contentMatch === 'exact' || result.contentMatch === 'partial') {
      return {
        status: 'VERIFIED',
        result: {
          strategy: 'tweet_lookup',
          match: result.contentMatch,
          actualContent: result.actualContent,
          discrepancies: result.discrepancies,
          grokResponse: result.grokResponse,
        },
        citations: result.citations,
      };
    }

    // Content mismatch — tweet exists but says something different
    return {
      status: 'FAILED',
      result: {
        strategy: 'tweet_lookup',
        match: result.contentMatch,
        actualContent: result.actualContent,
        discrepancies: result.discrepancies ?? ['Content does not match the actual tweet'],
        grokResponse: result.grokResponse,
      },
      citations: result.citations,
    };
  }

  // Non-XPOST types: corroboration search
  const result: CorroborationResult = await corroboratePost(
    post.content,
    post.handle,
    postType,
  );

  if (result.found && (result.confidence === 'high' || result.confidence === 'medium')) {
    return {
      status: result.confidence === 'high' ? 'VERIFIED' : 'PARTIAL',
      result: {
        strategy: 'corroboration',
        confidence: result.confidence,
        evidence: result.evidence,
        grokResponse: result.grokResponse,
      },
      citations: result.citations,
    };
  }

  if (result.found && result.confidence === 'low') {
    return {
      status: 'PARTIAL',
      result: {
        strategy: 'corroboration',
        confidence: result.confidence,
        evidence: result.evidence,
        grokResponse: result.grokResponse,
      },
      citations: result.citations,
    };
  }

  // Not found — for non-XPOST types we mark PARTIAL (not FAILED)
  // since the content might exist but Grok couldn't find it
  return {
    status: 'PARTIAL',
    result: {
      strategy: 'corroboration',
      confidence: 'none',
      evidence: result.evidence,
      grokResponse: result.grokResponse,
    },
    citations: result.citations,
  };
}

export function shouldSkipVerification(searchParams: URLSearchParams): boolean {
  return searchParams.get('skipVerification') === 'true';
}
