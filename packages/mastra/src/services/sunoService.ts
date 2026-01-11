/**
 * Suno API Service
 * Integração com a API do Suno para geração de músicas via IA
 *
 * Documentação: https://docs.sunoapi.org/
 */

const SUNO_API_BASE = 'https://api.sunoapi.org';

export type SunoModel = 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5';

export interface GenerateMusicParams {
    /** Letra da música */
    lyrics: string;
    /** Estilo/gênero musical */
    style: string;
    /** Título da música */
    title: string;
    /** Modelo a usar */
    model?: SunoModel;
    /** Se true, gera apenas instrumental */
    instrumental?: boolean;
    /** URL para callback quando a música estiver pronta */
    callbackUrl?: string;
}

export interface SunoGenerateResponse {
    code: number;
    msg: string;
    data: {
        taskId: string;
    };
}

export interface SunoTrack {
    id: string;
    audioUrl: string;
    streamAudioUrl: string;
    imageUrl: string;
    prompt: string;
    modelName: string;
    title: string;
    tags: string;
    createTime: string;
    duration: number;
}

export interface SunoStatusResponse {
    code: number;
    msg: string;
    data: {
        taskId: string;
        parentMusicId: string | null;
        param: string;
        response: {
            taskId: string;
            sunoData: SunoTrack[];
        } | null;
        status: SunoTaskStatus;
        type: string;
        errorCode: number | null;
        errorMessage: string | null;
    };
}

export type SunoTaskStatus =
    | 'PENDING'
    | 'TEXT_SUCCESS'
    | 'FIRST_SUCCESS'
    | 'SUCCESS'
    | 'CREATE_TASK_FAILED'
    | 'GENERATE_AUDIO_FAILED'
    | 'CALLBACK_EXCEPTION'
    | 'SENSITIVE_WORD_ERROR';

export interface SunoCreditResponse {
    code: number;
    msg: string;
    data: {
        credit: number;
    };
}

/**
 * Obtém a API key do Suno das variáveis de ambiente
 */
function getSunoApiKey(): string {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
        throw new Error('SUNO_API_KEY não configurada');
    }
    return apiKey;
}

/**
 * Faz uma requisição para a API do Suno
 */
async function sunoFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const apiKey = getSunoApiKey();

    const response = await fetch(`${SUNO_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Suno API error (${response.status}): ${errorText}`);
    }

    return response.json();
}

/**
 * Gera música usando a API do Suno
 *
 * @param params Parâmetros de geração
 * @returns TaskId para acompanhar o progresso
 */
export async function generateMusic(params: GenerateMusicParams): Promise<string> {
    const { lyrics, style, title, model = 'V5', instrumental = false, callbackUrl } = params;

    console.log(`[Suno] Generating music: "${title}" (${style})`);

    const requestBody: Record<string, unknown> = {
        customMode: true,
        instrumental,
        model,
        style,
        title,
        prompt: lyrics,
    };

    if (callbackUrl) {
        requestBody.callBackUrl = callbackUrl;
    }

    const response = await sunoFetch<SunoGenerateResponse>('/api/v1/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
    });

    if (response.code !== 200) {
        throw new Error(`Suno generation failed: ${response.msg}`);
    }

    console.log(`[Suno] Task created: ${response.data.taskId}`);
    return response.data.taskId;
}

/**
 * Verifica o status de uma tarefa de geração
 *
 * @param taskId ID da tarefa
 * @returns Status e dados das músicas geradas
 */
export async function getTaskStatus(taskId: string): Promise<SunoStatusResponse['data']> {
    console.log(`[Suno] Checking status for task: ${taskId}`);

    const response = await sunoFetch<SunoStatusResponse>(
        `/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`
    );

    if (response.code !== 200) {
        throw new Error(`Suno status check failed: ${response.msg}`);
    }

    console.log(`[Suno] Task ${taskId} status: ${response.data.status}`);
    return response.data;
}

/**
 * Verifica os créditos disponíveis na conta
 *
 * @returns Número de créditos disponíveis
 */
export async function getCredits(): Promise<number> {
    const response = await sunoFetch<SunoCreditResponse>('/api/v1/generate/credit');

    if (response.code !== 200) {
        throw new Error(`Failed to get Suno credits: ${response.msg}`);
    }

    return response.data.credit;
}

/**
 * Helper para verificar se um status indica que a geração terminou
 */
export function isTaskComplete(status: SunoTaskStatus): boolean {
    return status === 'SUCCESS' || isTaskFailed(status);
}

/**
 * Helper para verificar se um status indica falha
 */
export function isTaskFailed(status: SunoTaskStatus): boolean {
    return [
        'CREATE_TASK_FAILED',
        'GENERATE_AUDIO_FAILED',
        'CALLBACK_EXCEPTION',
        'SENSITIVE_WORD_ERROR',
    ].includes(status);
}

/**
 * Converte status para texto amigável em português
 */
export function getStatusLabel(status: SunoTaskStatus): string {
    const labels: Record<SunoTaskStatus, string> = {
        PENDING: 'Aguardando processamento...',
        TEXT_SUCCESS: 'Letra processada, gerando música...',
        FIRST_SUCCESS: 'Primeira faixa pronta, gerando segunda...',
        SUCCESS: 'Música gerada com sucesso!',
        CREATE_TASK_FAILED: 'Erro ao criar tarefa',
        GENERATE_AUDIO_FAILED: 'Erro ao gerar áudio',
        CALLBACK_EXCEPTION: 'Erro de callback',
        SENSITIVE_WORD_ERROR: 'Conteúdo bloqueado (palavra sensível)',
    };
    return labels[status] || status;
}

export default {
    generateMusic,
    getTaskStatus,
    getCredits,
    isTaskComplete,
    isTaskFailed,
    getStatusLabel,
};
