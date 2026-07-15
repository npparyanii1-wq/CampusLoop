import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Asset } from '../database/entities/asset.entity';
import { Booking } from '../database/entities/booking.entity';
import { StudyGroupInterest } from '../database/entities/study-group-interest.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly isMockMode: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
    this.isMockMode = !this.apiKey || this.apiKey === 'your_api_key_here' || !this.apiKey.startsWith('sk-');
    if (this.isMockMode) {
      this.logger.warn('OpenAI API Key is empty or placeholder. AiService will run in High-Fidelity Mock Mode.');
    } else {
      this.logger.log('OpenAI API Key detected. Real LLM connection active.');
    }
  }

  async smartSearch(query: string, assets: Asset[]): Promise<{
    matches: Array<{ asset: Asset; rationale: string; predictedReturnDate: string }>;
    alternatives: Asset[];
  }> {
    if (this.isMockMode) {
      return this.mockSmartSearch(query, assets);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an assistant for a university resource booking system. Analyze the user request and map it to the available assets. Return JSON format only: { matches: [{ assetId: string, rationale: string, predictedReturnDays: number }], alternatives: [string] }',
            },
            {
              role: 'user',
              content: `Query: "${query}". Available assets: ${JSON.stringify(
                assets.map(a => ({ id: a.id, name: a.name, category: a.category, description: a.description, status: a.status }))
              )}`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      const matches = [];
      const matchedIds = new Set();

      for (const m of result.matches || []) {
        const asset = assets.find(a => a.id === m.assetId);
        if (asset) {
          const returnDate = new Date();
          const days = m.predictedReturnDays || (asset.category === 'room' ? 0.1 : 3);
          returnDate.setHours(returnDate.getHours() + days * 24);
          
          matches.push({
            asset,
            rationale: m.rationale,
            predictedReturnDate: returnDate.toISOString(),
          });
          matchedIds.add(asset.id);
        }
      }

      const alternatives = assets.filter(a => !matchedIds.has(a.id) && a.status === 'available').slice(0, 2);

      return { matches, alternatives };
    } catch (error) {
      this.logger.error('OpenAI smartSearch error, falling back to mock search.', error);
      return this.mockSmartSearch(query, assets);
    }
  }

  private mockSmartSearch(query: string, assets: Asset[]) {
    const queryLower = query.toLowerCase();
    const matches = [];
    const matchedIds = new Set();

    for (const asset of assets) {
      let score = 0;
      let rationale = '';

      if (queryLower.includes('audio') || queryLower.includes('record') || queryLower.includes('sound') || queryLower.includes('camera') || queryLower.includes('mic')) {
        if (asset.name.includes('Camera') || asset.category === 'equipment') {
          score = asset.name.includes('Camera') ? 10 : 2;
          rationale = 'Recommended for audio/video recording since it contains high-quality recording sensors and microphone input support.';
        }
      }
      if (queryLower.includes('vr') || queryLower.includes('virtual') || queryLower.includes('headset') || queryLower.includes('game')) {
        if (asset.name.includes('VR') || asset.name.includes('Quest')) {
          score = 10;
          rationale = 'Matches VR/virtual reality research criteria. Excellent portable development unit.';
        }
      }
      if (queryLower.includes('lab') || queryLower.includes('chemical') || queryLower.includes('spectr') || queryLower.includes('science')) {
        if (asset.name.includes('Spectrometer') || asset.department?.name === 'Chemistry') {
          score = asset.name.includes('Spectrometer') ? 10 : 3;
          rationale = 'Matches molecular and scientific chemical analysis requirements.';
        }
      }
      if (queryLower.includes('room') || queryLower.includes('study') || queryLower.includes('whiteboard') || queryLower.includes('quiet') || queryLower.includes('group')) {
        if (asset.category === 'room') {
          score = asset.name.includes('Lab') ? 10 : 8;
          rationale = 'Ideal study space equipped with whiteboard markers, screen casting, and comfortable seating.';
        }
      }
      if (queryLower.includes('bike') || queryLower.includes('cycle') || queryLower.includes('transit') || queryLower.includes('transport')) {
        if (asset.name.includes('Bike') || asset.category === 'loanable') {
          score = 10;
          rationale = 'Provides quick peer-to-peer transport around campus. Easy checkout and return.';
        }
      }

      if (score === 0 && (asset.name.toLowerCase().includes(queryLower) || asset.description.toLowerCase().includes(queryLower))) {
        score = 5;
        rationale = `Matches keyword phrase found in name and description metadata.`;
      }

      if (score > 0) {
        const returnDate = new Date();
        if (asset.category === 'room') {
          returnDate.setHours(returnDate.getHours() + 2);
        } else if (asset.category === 'equipment') {
          returnDate.setDate(returnDate.getDate() + 3);
        } else {
          returnDate.setDate(returnDate.getDate() + 1);
        }

        matches.push({
          asset,
          rationale,
          predictedReturnDate: returnDate.toISOString(),
        });
        matchedIds.add(asset.id);
      }
    }

    matches.sort((a, b) => b.asset.status === 'available' ? 1 : -1);

    if (matches.length === 0) {
      const basicMatches = assets.slice(0, 2);
      for (const asset of basicMatches) {
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 3);
        matches.push({
          asset,
          rationale: 'Standard match based on catalog relevance index.',
          predictedReturnDate: returnDate.toISOString(),
        });
        matchedIds.add(asset.id);
      }
    }

    const alternatives = assets.filter(a => !matchedIds.has(a.id) && a.status === 'available').slice(0, 2);

    return { matches, alternatives };
  }

  async assessCondition(
    photoUrl: string,
    description: string,
    prevCondition: string
  ): Promise<{
    condition: string;
    damageDescription: string;
    action: string;
  }> {
    if (this.isMockMode) {
      return this.mockAssessCondition(description, prevCondition);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an AI inspector for returned assets. Examine user text and image. Respond in JSON format only: { condition: "excellent"|"good"|"fair"|"damaged", damageDescription: string, action: "ready for reuse"|"needs repair"|"retire" }',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Description of return state: "${description}". Previous condition was "${prevCondition}".`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: photoUrl || 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500',
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      this.logger.error('OpenAI assessCondition error, falling back to mock assessment.', error);
      return this.mockAssessCondition(description, prevCondition);
    }
  }

  private mockAssessCondition(description: string, prevCondition: string) {
    const text = description.toLowerCase();
    
    const isDamaged = text.includes('crack') || text.includes('broken') || text.includes('shatter') || text.includes('destroyed') || text.includes('fell') || text.includes('dropped');
    const isFair = text.includes('scratch') || text.includes('dent') || text.includes('dirty') || text.includes('wear') || text.includes('loose') || text.includes('scuff');

    if (isDamaged) {
      return {
        condition: 'damaged',
        damageDescription: `AI identified words related to structural failure: "${description}". Recommended action matches repair or deprecation review.`,
        action: 'needs repair',
      };
    } else if (isFair) {
      return {
        condition: 'fair',
        damageDescription: `AI identified cosmetic wear: "${description}". Check joints and connections.`,
        action: 'needs repair',
      };
    } else {
      return {
        condition: prevCondition === 'damaged' ? 'fair' : prevCondition || 'good',
        damageDescription: 'Clean return with no structural or cosmetic flaws reported.',
        action: 'ready for reuse',
      };
    }
  }

  async matchStudyGroups(
    subject: StudyGroupInterest,
    pool: StudyGroupInterest[]
  ): Promise<Array<{ match: StudyGroupInterest; score: number; rationale: string }>> {
    if (this.isMockMode) {
      return this.mockMatchStudyGroups(subject, pool);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Compare the target student study interest with other students. Return ranked matches in JSON format: { matches: [{ studentInterestId: string, score: number, rationale: string }] }',
            },
            {
              role: 'user',
              content: `Target Student: ${JSON.stringify(subject)}. Pool of students: ${JSON.stringify(pool)}`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      const rankedMatches = [];
      for (const rm of result.matches || []) {
        const match = pool.find(p => p.id === rm.studentInterestId);
        if (match) {
          rankedMatches.push({
            match,
            score: rm.score,
            rationale: rm.rationale,
          });
        }
      }
      return rankedMatches;
    } catch (error) {
      this.logger.error('OpenAI matchStudyGroups error, falling back to mock matcher.', error);
      return this.mockMatchStudyGroups(subject, pool);
    }
  }

  private mockMatchStudyGroups(subject: StudyGroupInterest, pool: StudyGroupInterest[]) {
    const matches = [];
    const mySlots = JSON.parse(subject.availabilitySlots || '[]');

    for (const peer of pool) {
      if (peer.id === subject.id || peer.userId === subject.userId) continue;

      let score = 50;
      const rationales = [];

      if (peer.moduleCode === subject.moduleCode) {
        score += 25;
        rationales.push(`Both are enrolled in ${subject.moduleCode}.`);
      } else {
        continue;
      }

      if (peer.preferredStyle === subject.preferredStyle) {
        score += 15;
        rationales.push(`Shared study style preference: "${subject.preferredStyle}".`);
      } else {
        score += 5;
        rationales.push(`Complementary study style (${subject.preferredStyle} vs ${peer.preferredStyle}).`);
      }

      const peerSlots = JSON.parse(peer.availabilitySlots || '[]');
      const overlap = mySlots.filter(slot => peerSlots.includes(slot));
      if (overlap.length > 0) {
        score += Math.min(overlap.length * 10, 20);
        rationales.push(`Overlap found in schedules on: ${overlap.join(', ')}.`);
      } else {
        score -= 15;
        rationales.push('No direct calendar overlap; will need schedule negotiation.');
      }

      const finalScore = Math.max(0, Math.min(score, 100));

      matches.push({
        match: peer,
        score: finalScore,
        rationale: rationales.join(' '),
      });
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  async detectAnomalies(
    bookings: Booking[],
    assets: Asset[]
  ): Promise<{
    bottlenecks: Array<{ asset: Asset; bookingCount: number; recommendation: string }>;
    idles: Array<{ asset: Asset; bookingCount: number; targetDepartment: string; recommendation: string }>;
  }> {
    const bookingCounts = {};
    for (const b of bookings) {
      bookingCounts[b.assetId] = (bookingCounts[b.assetId] || 0) + 1;
    }

    const bottlenecks = [];
    const idles = [];

    for (const asset of assets) {
      const count = bookingCounts[asset.id] || 0;
      if (count >= 5 || (asset.category === 'room' && count >= 3)) {
        bottlenecks.push({
          asset,
          bookingCount: count,
          recommendation: `High demand booking bottleneck detected. Recommend increasing inventory allocation by 1 unit or adding duplicate scheduling slots.`,
        });
      } else if (count === 0) {
        const targetDept = asset.department?.name === 'Chemistry' ? 'Computer Science' : 'Chemistry';
        idles.push({
          asset,
          bookingCount: count,
          targetDepartment: targetDept,
          recommendation: `Asset remains unused. Recommended candidate for reallocation from ${asset.department?.name} to ${targetDept} department.`,
        });
      }
    }

    return { bottlenecks, idles };
  }
}