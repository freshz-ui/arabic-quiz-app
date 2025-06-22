import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function Progress({ user }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) fetchProgress();
  }, [user]);

  const fetchProgress = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        ease, correct_count, incorrect_count,
        english_words(id, "English Meaning", arabic_forms(form_type, form_value))
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching progress:', error);
      setLoading(false);
      return;
    }

    const sorted = data.sort((a, b) => (a.ease ?? 1) - (b.ease ?? 1));
    setWords(sorted);
    setLoading(false);
  };

  const getStrength = (ease) => {
    if (ease >= 5) return 'Strong';
    if (ease >= 3) return 'Medium';
    return 'Weak';
  };

  const getStrengthColor = (ease) => {
    if (ease >= 5) return '#2ecc71';
    if (ease >= 3) return '#f1c40f';
    return '#e74c3c';
  };

  const counts = { Strong: 0, Medium: 0, Weak: 0 };
  words.forEach(w => counts[getStrength(w.ease ?? 1)]++);
  const totalWords = words.length || 1;

  const visibleWords = words.filter(w => {
    if (filter === 'weak') return getStrength(w.ease ?? 1) === 'Weak';
    return true;
  });

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊 Your Progress</h2>

      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ fontSize: '1.1rem' }}>Mastery Summary:</strong>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          <li>🟢 Strong: {counts.Strong}</li>
          <li>🟡 Medium: {counts.Medium}</li>
          <li>🔴 Weak: {counts.Weak}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setFilter('all')} style={{
          marginRight: '1rem',
          backgroundColor: filter === 'all' ? '#3498db' : '#ccc',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>Show All</button>
        <button onClick={() => setFilter('weak')} style={{
          backgroundColor: filter === 'weak' ? '#e74c3c' : '#ccc',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>Show Only Weak</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : visibleWords.length === 0 ? (
        <p>No words match this filter.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>English</th>
                <th style={{ padding: '0.75rem' }}>Arabic</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ease</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Correct</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Incorrect</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Strength</th>
              </tr>
            </thead>
            <tbody>
              {visibleWords.map((w, i) => {
                const word = w.english_words;
                const strength = getStrength(w.ease ?? 1);
                const color = getStrengthColor(w.ease ?? 1);
                return (
                  <tr key={word.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f5f5f5' }}>
                    <td style={{ padding: '0.75rem' }}>{word["English Meaning"]}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                        {word.arabic_forms.map((f, j) => (
                          <li key={j}><strong>{f.form_type}:</strong> {f.form_value}</li>
                        ))}
                      </ul>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{w.ease}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{w.correct_count}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{w.incorrect_count}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: color,
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>{strength}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
