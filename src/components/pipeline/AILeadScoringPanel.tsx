import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TrendingUp, Zap, Target, AlertCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  status: string;
  source?: string;
  estimatedValue?: number;
  aiScore?: number;
}

interface ScoreBreakdown {
  investmentReadiness: number; // 0-30 points
  companySize: number; // 0-20 points
  stablesignals: number; // 0-30 points
  conversionHistory: number; // 0-20 points
}

export function AILeadScoringPanel() {
  const [leads, setLeads] = useState<(Lead & { scoreBreakdown: ScoreBreakdown; aiScore: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAndScoreLeads();
  }, []);

  const loadAndScoreLeads = async () => {
    try {
      setLoading(true);
      const leadsRef = collection(db, 'leads');
      const snapshot = await getDocs(leadsRef);

      const scoredLeads = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const lead = { id: docSnapshot.id, ...docSnapshot.data() } as Lead;
          const scoreBreakdown = calculateLeadScore(lead);
          const aiScore = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);

          // Save score to Firestore
          try {
            await updateDoc(doc(db, 'leads', lead.id), { aiScore });
          } catch (err) {
            console.error('Failed to save score:', err);
          }

          return { ...lead, scoreBreakdown, aiScore };
        })
      );

      const sorted = scoredLeads.sort((a, b) => b.aiScore - a.aiScore);
      setLeads(sorted);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLeadScore = (lead: Lead): ScoreBreakdown => {
    let investmentReadiness = 0;
    let companySize = 0;
    let stablesignals = 0;
    let conversionHistory = 0;

    // Investment Readiness (0-30)
    if (lead.estimatedValue) {
      if (lead.estimatedValue >= 50000) investmentReadiness += 30;
      else if (lead.estimatedValue >= 20000) investmentReadiness += 25;
      else if (lead.estimatedValue >= 10000) investmentReadiness += 15;
      else investmentReadiness += 5;
    }

    // Company Size (0-20)
    if (lead.company) {
      const companyLength = lead.company.length;
      if (companyLength > 20) companySize += 20;
      else if (companyLength > 10) companySize += 15;
      else companySize += 10;
    } else {
      companySize += 5;
    }

    // Stablecoin Interest Signals (0-30)
    const email = lead.email.toLowerCase();
    const company = (lead.company || '').toLowerCase();
    const firstName = (lead.firstName || '').toLowerCase();
    const lastName = (lead.lastName || '').toLowerCase();

    // Check for crypto/finance related keywords
    const cryptoKeywords = ['crypto', 'defi', 'blockchain', 'finance', 'invest', 'trading', 'vault', 'staking'];
    const textToSearch = `${email} ${company} ${firstName} ${lastName}`;

    stablesignals += cryptoKeywords.filter(kw => textToSearch.includes(kw)).length * 8;
    stablesignals = Math.min(stablesignals, 30);

    // Source qualification (0-20)
    if (lead.source === 'referral') conversionHistory += 20;
    else if (lead.source === 'website' || lead.source === 'content') conversionHistory += 15;
    else if (lead.source === 'email') conversionHistory += 10;
    else conversionHistory += 5;

    return {
      investmentReadiness,
      companySize,
      stablesignals,
      conversionHistory,
    };
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Calculating lead scores...</div>
        </CardContent>
      </Card>
    );
  }

  const topLeads = leads.slice(0, 5);
  const avgScore = leads.length > 0 ? leads.reduce((sum, l) => sum + l.aiScore, 0) / leads.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-900">AI Lead Scoring</h2>
          <p className="text-primary-600 text-sm mt-1">Investment readiness + stablecoin interest analysis</p>
        </div>
        <button
          onClick={loadAndScoreLeads}
          className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Recalculate Scores
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Total Leads
            </div>
            <div className="text-4xl font-bold text-primary-900 mt-2">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average Score
            </div>
            <div className="text-4xl font-bold text-accent-600 mt-2">{avgScore.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" />
              Hot Leads (80+)
            </div>
            <div className="text-4xl font-bold text-success-600 mt-2">
              {leads.filter(l => l.aiScore >= 80).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Low Score (&lt;40)
            </div>
            <div className="text-4xl font-bold text-danger-600 mt-2">
              {leads.filter(l => l.aiScore < 40).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent-600" />
            Top Priority Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Lead Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Company</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Investment</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {topLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-primary-100 hover:bg-primary-50">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-primary-900">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-primary-600 text-xs">{lead.email}</div>
                    </td>
                    <td className="py-4 px-4 text-primary-700">{lead.company || '-'}</td>
                    <td className="py-4 px-4 text-accent-600 font-semibold">
                      ${((lead.estimatedValue || 0) / 1000).toFixed(0)}K
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getScoreBadge(lead.aiScore) as any}>
                        {lead.aiScore} • {getScoreLabel(lead.aiScore)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span title="Investment Readiness">💰{lead.scoreBreakdown.investmentReadiness}</span>
                        <span title="Company Size">🏢{lead.scoreBreakdown.companySize}</span>
                        <span title="Stablecoin Signals">🔗{lead.scoreBreakdown.stablesignals}</span>
                        <span title="Conversion History">📈{lead.scoreBreakdown.conversionHistory}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Score Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-primary-900 mb-3">Score Factors</h4>
              <ul className="space-y-2 text-sm text-primary-700">
                <li>• <strong>Investment Readiness (0-30):</strong> Estimated deal size + capacity</li>
                <li>• <strong>Company Size (0-20):</strong> Organization scope & growth potential</li>
                <li>• <strong>Stablecoin Interest (0-30):</strong> Crypto/DeFi keyword match</li>
                <li>• <strong>Conversion History (0-20):</strong> Lead source quality</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary-900 mb-3">Score Ranges</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="success">80+</Badge>
                  <span className="text-primary-700">Excellent - High conversion probability</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="info">60-79</Badge>
                  <span className="text-primary-700">Good - Worth pursuing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="warning">40-59</Badge>
                  <span className="text-primary-700">Fair - May need nurturing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="error">&lt;40</Badge>
                  <span className="text-primary-700">Poor - Low priority</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
