import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './Auth';
import Progress from './Progress';

function App() {
  const [user, setUser] = useState(null);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('quiz');
  const [lastQuestionId, setLastQuestionId] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (user && view === 'quiz') fetchQuestion();
  }, [user, view]);

const fetchQuestion = async () => {
  setLoading(true);

  const { data: words, error: wordError } = await supabase
    .from('english_words')
    .select('id, "English Meaning", arabic_forms(form_type, form_value)');

  if (wordError || !words) {
    console.error('Error fetching words:', wordError);
    setLoading(false);
    return;
  }

  const { data: progress, error: progressError } = await supabase
    .from('user_progress')
    .select('english_id, ease, correct_count, incorrect_count, seen')
    .eq('user_id', user.id);

  if (progressError) {
    console.error('Error fetching progress:', progressError);
  }

  const progressMap = {};
  (progress || []).forEach(p => {
    progressMap[p.english_id] = p;
  });

  const filtered = words.filter(w => w.arabic_forms?.length > 0);
  if (!filtered.length) {
    alert('No vocab data found.');
    setLoading(false);
    return;
  }

  const weighted = filtered.flatMap(word => {
    const progress = progressMap[word.id];
    let weight;

    if (!progress || progress.seen !== true) {
      weight = 4; // Unseen words get higher priority
    } else {
      const ease = progress.ease ?? 1;
      weight = Math.max(1, 6 - ease);
    }

    return Array(weight).fill({ ...word, progress });
  });

  let question;
  let attempts = 0;
  do {
    question = weighted[Math.floor(Math.random() * weighted.length)];
    attempts++;
  } while (question.id === lastQuestionId && attempts < 10);
  setLastQuestionId(question.id);

  const incorrect = filtered
    .filter(w => w.id !== question.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => ({ ...w, progress: progressMap[w.id] }));

  const allOptions = [...incorrect, question].sort(() => 0.5 - Math.random());

  setQuestion(question);
  setOptions(allOptions);
  setLoading(false);
};


const handleAnswer = async (selected) => {
  setSelectedAnswer(selected);

  const isCorrect = selected === question["English Meaning"];
  const currentEase = question.progress?.ease ?? 1;
  const newEase = isCorrect ? Math.min(currentEase + 1, 5) : 1;
  const prevCorrect = question.progress?.correct_count ?? 0;
  const prevIncorrect = question.progress?.incorrect_count ?? 0;

  await supabase.from('user_progress').upsert({
    user_id: user.id,
    english_id: question.id,
    ease: newEase,
    last_seen: new Date().toISOString(),
    seen: true,
    correct_count: isCorrect ? prevCorrect + 1 : prevCorrect,
    incorrect_count: isCorrect ? prevIncorrect : prevIncorrect + 1
  });

  // Wait a moment, then fetch the next question
  setTimeout(() => {
    setSelectedAnswer(null);
    fetchQuestion();
  }, 1200);
};


return (
  <div className="container" style={{ maxWidth: '700px', margin: 'auto', padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1>Arabic Vocab</h1>

    {!user ? (
      <Auth onAuth={setUser} />
    ) : (
      <>
        <nav style={{ marginBottom: '1rem' }}>
          <button onClick={() => setView('quiz')} style={{ marginRight: '1rem' }}>
            Quiz
          </button>
          <button onClick={() => setView('progress')}>Progress</button>
        </nav>

        {view === 'progress' ? (
          <Progress user={user} />
        ) : loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2>What is the meaning of:</h2>
            <ul style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
              {question.arabic_forms.map((form, i) => (
                <li key={i}>
                  <strong>{form.form_type}:</strong> {form.form_value}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '1rem' }}>
              {options.map((opt, i) => {
                const isCorrect = opt["English Meaning"] === question["English Meaning"];
                const isSelected = selectedAnswer === opt["English Meaning"];
                const bgColor =
                  selectedAnswer
                    ? isCorrect
                      ? '#2ecc71' // green
                      : isSelected
                        ? '#e74c3c' // red
                        : '#ddd'
                    : '#fff';

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt["English Meaning"])}
                    disabled={!!selectedAnswer}
                    style={{
                      display: 'block',
                      margin: '0.5rem 0',
                      padding: '0.75rem 1rem',
                      width: '100%',
                      fontSize: '1rem',
                      cursor: selectedAnswer ? 'default' : 'pointer',
                      backgroundColor: bgColor,
                      border: '1px solid #ccc',
                      borderRadius: '5px'
                    }}
                  >
                    
                    {opt["English Meaning"]}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </>
    )}
  </div>
);
}

export default App;

