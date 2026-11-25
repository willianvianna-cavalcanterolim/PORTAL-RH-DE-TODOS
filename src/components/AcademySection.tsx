import React, { useEffect, useState } from 'react';
import { Award, BookOpen, CheckCircle2, Clock, ExternalLink, X } from 'lucide-react';
import type { TrainingModule } from '../types/portal';
import { CODIGO_CONDUTA_EXAM_QUESTIONS, CODIGO_CONDUTA_PDF_PATH } from '../data/seedData';
import { ImageProcessor } from './ImageProcessor';

interface AcademySectionProps {
  trainings: TrainingModule[];
  completedIds: Set<string>;
  externalModule?: TrainingModule | null;
  onClearExternalModule?: () => void;
  onCompleteTraining: (training: TrainingModule) => Promise<void>;
  isAuthenticated: boolean;
}

export const AcademySection: React.FC<AcademySectionProps> = ({
  trainings,
  completedIds,
  externalModule,
  onClearExternalModule,
  onCompleteTraining,
  isAuthenticated,
}) => {
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Array<number | null>>([]);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isMultiQuestionExam = (mod: TrainingModule | null) =>
    mod?.id === 'treino_codigo_conduta_etica_cr';

  const getQuestionsForModule = (mod: TrainingModule) => {
    if (isMultiQuestionExam(mod)) {
      return CODIGO_CONDUTA_EXAM_QUESTIONS;
    }
    return [
      {
        question: mod.quizQuestion,
        options: mod.quizOptions,
        correctIndex: mod.correctOptionIndex,
      },
    ];
  };

  const openModule = (mod: TrainingModule) => {
    const questions = getQuestionsForModule(mod);
    setActiveModule(mod);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setQuizFeedback(null);
  };

  useEffect(() => {
    if (externalModule) {
      openModule(externalModule);
      onClearExternalModule?.();
    }
  }, [externalModule, onClearExternalModule]);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
    setQuizFeedback(null);
  };

  const handleSubmitQuiz = async () => {
    if (!activeModule) return;
    const questions = getQuestionsForModule(activeModule);
    const allAnswered =
      selectedAnswers.length === questions.length &&
      selectedAnswers.every((ans) => ans !== null);

    if (!allAnswered) {
      setQuizFeedback('Responda todas as questões antes de enviar a avaliação.');
      return;
    }

    const wrongIndices: number[] = [];
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] !== q.correctIndex) {
        wrongIndices.push(idx + 1);
      }
    });

    if (wrongIndices.length > 0) {
      setQuizFeedback(
        wrongIndices.length === 1
          ? `A Questão ${wrongIndices[0]} precisa de revisão. Consulte o conteúdo programático e tente novamente.`
          : `As Questões ${wrongIndices.join(', ')} precisam de revisão conforme as diretrizes da Cavalcante & Rolim.`
      );
      return;
    }

    setSubmitting(true);
    setQuizFeedback(null);
    try {
      await onCompleteTraining(activeModule);
      setQuizFeedback(
        `Parabéns! Aprovação integral registrada. Selo "${activeModule.badgeAwarded}" e +${activeModule.pointsReward} pts adicionados ao seu perfil.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeQuestions = activeModule ? getQuestionsForModule(activeModule) : [];
  const allQuestionsAnswered =
    activeQuestions.length > 0 &&
    selectedAnswers.length === activeQuestions.length &&
    selectedAnswers.every((a) => a !== null);

  return (
    <section
      id="academia"
      className="py-16 sm:py-20 bg-white dark:bg-[#0E1B16] border-b border-[#1C2421]/10 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-2">
              Desenvolvimento Contínuo &amp; Compliance
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2421] dark:text-white">
              Academia Cavalcante &amp; Rolim
            </h2>
          </div>
          <p className="text-sm text-[#1C2421]/70 dark:text-white/70 max-w-md">
            Capacitações técnicas, segurança em obra e Código de Conduta e Ética com certificação e conquista de selos dourados.
          </p>
        </div>

        {trainings.length === 0 ? (
          <div className="py-14 text-center bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467]/30 rounded-xl">
            <p className="text-sm text-[#1C2421]/70 dark:text-white/70">
              {isAuthenticated
                ? 'Nenhum módulo de treinamento publicado no momento.'
                : 'Conecte-se com sua conta Google para iniciar os módulos gamificados da Academia C&R.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {trainings.map((mod) => {
              const completed = completedIds.has(mod.id);
              const qCount = getQuestionsForModule(mod).length;
              return (
                <div
                  key={mod.id}
                  className="bg-[#F8F7F4] dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2 pb-0">
                      <ImageProcessor
                        src={mod.coverUrl}
                        alt={mod.title}
                        aspectRatio="16:9"
                        variant="card"
                        roundedClassName="rounded-lg"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#1C2421]/65 dark:text-white/65 mb-2">
                        <span className="font-semibold text-[#11382B] dark:text-[#D8BC83]">
                          {mod.track}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3.5 h-3.5" /> {mod.durationMinutes} min
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">+{mod.pointsReward} pts</span>
                      </div>

                      <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white mb-2.5">
                        {mod.title}
                      </h3>

                      <p className="text-sm text-[#1C2421]/75 dark:text-white/75 leading-relaxed mb-4">
                        {mod.summary}
                      </p>

                      <div className="text-xs text-[#11382B] dark:text-[#D8BC83] flex items-center gap-1.5 font-medium">
                        <Award className="w-4 h-4 text-[#C5A467] shrink-0" />
                        <span>Selo concedido: {mod.badgeAwarded}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-[#1C2421]/10 dark:border-white/10 flex items-center justify-between gap-2">
                    {completed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#11382B] dark:text-[#D8BC83]">
                        <CheckCircle2 className="w-4 h-4 text-[#C5A467]" />
                        Concluído
                      </span>
                    ) : (
                      <span className="text-xs text-[#1C2421]/60 dark:text-white/60 tabular-nums">
                        {mod.lessons.length} lições · {qCount}{' '}
                        {qCount === 1 ? 'questão' : 'questões'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => openModule(mod)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#C5A467]" />
                      <span>{completed ? 'Revisar' : 'Iniciar Módulo'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Interativo de Treinamento e Avaliação */}
      {activeModule && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="training-modal-title"
        >
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467]/60 rounded-xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#1C2421]/10 dark:border-white/10">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-1">
                  {activeModule.track} · +{activeModule.pointsReward} pts
                </p>
                <h3
                  id="training-modal-title"
                  className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2421] dark:text-white"
                >
                  {activeModule.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule(null)}
                className="w-9 h-9 rounded-lg border border-[#1C2421]/20 dark:border-white/20 flex items-center justify-center text-[#1C2421] dark:text-white hover:border-[#C5A467] cursor-pointer shrink-0"
                aria-label="Fechar treinamento"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1C2421]/70 dark:text-white/70">
                    Conteúdo Programático
                  </h4>
                  {isMultiQuestionExam(activeModule) && (
                    <a
                      href={CODIGO_CONDUTA_PDF_PATH}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] hover:underline"
                    >
                      <span>Abrir Manual Completo (PDF)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <ul className="space-y-2.5">
                  {activeModule.lessons.map((lesson, idx) => (
                    <li
                      key={idx}
                      className="p-3.5 rounded-lg bg-white dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10 text-sm text-[#1C2421] dark:text-white/90"
                    >
                      {lesson}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[#1C2421]/10 dark:border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1C2421]/70 dark:text-white/70">
                    Verificação de Conhecimento ({activeQuestions.length}{' '}
                    {activeQuestions.length === 1 ? 'questão' : 'questões'})
                  </h4>
                  <span className="text-xs font-mono text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                    {selectedAnswers.filter((a) => a !== null).length}/{activeQuestions.length}{' '}
                    respondidas
                  </span>
                </div>

                {activeQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2.5">
                    <p className="text-sm font-semibold text-[#1C2421] dark:text-white">
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => {
                        const checked = selectedAnswers[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                              checked
                                ? 'bg-[#11382B] text-white border-[#C5A467]'
                                : 'bg-white dark:bg-[#0B1410] text-[#1C2421] dark:text-white/85 border-[#1C2421]/15 dark:border-white/15 hover:border-[#C5A467]'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {quizFeedback && (
                  <p className="p-3.5 rounded-lg bg-[#11382B]/8 dark:bg-[#0B241B] border border-[#C5A467]/50 text-sm font-medium text-[#11382B] dark:text-[#D8BC83]">
                    {quizFeedback}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-5 border-t border-[#1C2421]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              {!isAuthenticated && (
                <p className="text-xs text-[#1C2421]/65 dark:text-white/65">
                  Faça login com sua conta Google no topo do portal para registrar os pontos e desbloquear o selo.
                </p>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setActiveModule(null)}
                  className="px-4 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 text-sm text-[#1C2421] dark:text-white cursor-pointer"
                >
                  Fechar
                </button>
                {!completedIds.has(activeModule.id) && (
                  <button
                    type="button"
                    disabled={!allQuestionsAnswered || submitting || !isAuthenticated}
                    onClick={handleSubmitQuiz}
                    className="px-5 py-2.5 rounded-lg bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83] disabled:opacity-50 transition-colors text-sm font-semibold cursor-pointer"
                  >
                    {submitting
                      ? 'Validando...'
                      : `Concluir & Receber +${activeModule.pointsReward} pts`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
