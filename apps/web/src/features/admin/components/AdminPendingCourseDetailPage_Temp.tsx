
function ActivityItem({ activity }: { activity: any }) {
    let parsedContent = null
    let error = null

    try {
        if (typeof activity.activity_content === 'string') {
            parsedContent = JSON.parse(activity.activity_content)
        } else {
            parsedContent = activity.activity_content
        }
    } catch (e) {
        error = 'Error parsing JSON content'
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${activity.activity_type === 'quiz' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                            activity.activity_type === 'ai_chat' || activity.activity_type === 'lia_script' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                        {activity.activity_type}
                    </span>
                    <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{activity.activity_title}</h5>
                </div>
            </div>

            <div className="p-4">
                {error ? (
                    <div className="text-red-500 text-xs font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        {error}. Raw: {String(activity.activity_content).substring(0, 100)}...
                    </div>
                ) : (
                    <div className="text-sm">
                        {(activity.activity_type === 'quiz') && <QuizViewer data={parsedContent} />}
                        {(activity.activity_type === 'lia_script' || activity.activity_type === 'ai_chat') && <ScriptViewer data={parsedContent} />}

                        {/* Fallback for other types */}
                        {activity.activity_type !== 'quiz' && activity.activity_type !== 'lia_script' && activity.activity_type !== 'ai_chat' && (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                {JSON.stringify(parsedContent, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function QuizViewer({ data }: { data: any }) {
    if (!data || !data.items) return <p className="text-gray-400 italic">Datos de Quiz inválidos</p>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 pb-2">
                <span>Passing Score: {data.passing_score}%</span>
                <span>{data.items.length} Preguntas</span>
            </div>

            {data.items.map((item: any, idx: number) => (
                <div key={item.id || idx} className="bg-white dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {idx + 1}. {item.question}
                    </p>
                    <div className="space-y-1 pl-2">
                        {item.options?.map((opt: string, optIdx: number) => {
                            // Check if this option is the correct answer
                            // correct_answer can be index (number) or string value
                            const isCorrect = (typeof item.correct_answer === 'number' && item.correct_answer === optIdx) ||
                                (item.correct_answer === opt)

                            return (
                                <div key={optIdx} className={`flex items-center gap-2 text-xs ${isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {isCorrect ? <CheckCircleIcon className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />}
                                    <span>{opt}</span>
                                </div>
                            )
                        })}
                    </div>
                    {item.explanation && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
                            <span className="font-bold">Explicación:</span> {item.explanation}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

function ScriptViewer({ data }: { data: any }) {
    if (!data || !data.scenes) return <p className="text-gray-400 italic">Datos de Script inválidos</p>

    return (
        <div className="space-y-4">
            {data.introduction && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-200 italic mb-4">
                    "{data.introduction}"
                </div>
            )}

            <div className="space-y-3">
                {data.scenes.map((scene: any, idx: number) => (
                    <div key={idx} className={`flex gap-3 ${scene.character === 'Usuario' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${scene.character === 'Lia' ? 'bg-purple-500' : 'bg-gray-500'
                            }`}>
                            {scene.character?.[0] || '?'}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${scene.character === 'Usuario'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-tr-none'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                            }`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs opacity-70">{scene.character}</span>
                                {scene.emotion && <span className="text-[10px] uppercase tracking-wide opacity-50 border border-current px-1 rounded">{scene.emotion}</span>}
                            </div>
                            <p>{scene.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            {data.conclusion && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500 text-sm text-green-900 dark:text-green-100">
                    <span className="font-bold">Conclusión:</span> {data.conclusion}
                </div>
            )}
        </div>
    )
}
