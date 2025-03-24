import { Provider, AnyObject, Model, PromptRequest, Icon, RunResult, AnswerUsage, PromptRequestMessage } from '@ale-run/plugin-ai-assistant';
import OpenAI from 'openai';
import { Logger } from '@ale-run/runtime';
import { Readable, PassThrough } from 'stream';

const logger = Logger.getLogger('plugin:example-ai-provider');

export class ExampleAIProvider extends Provider {
  public readonly displayName = 'OpenAI';
  public readonly icon: Icon = {
    src: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI1MDAiIHZpZXdCb3g9Ii0xIC0uMSA5NDkuMSA5NTkuOCIgd2lkdGg9IjI0NzQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cgk8cGF0aCBkPSJtOTI1LjggNDU2LjNjMTAuNCAyMy4yIDE3IDQ4IDE5LjcgNzMuMyAyLjYgMjUuMyAxLjMgNTAuOS00LjEgNzUuOC01LjMgMjQuOS0xNC41IDQ4LjgtMjcuMyA3MC44LTguNCAxNC43LTE4LjMgMjguNS0yOS43IDQxLjItMTEuMyAxMi42LTIzLjkgMjQtMzcuNiAzNC0xMy44IDEwLTI4LjUgMTguNC00NC4xIDI1LjMtMTUuNSA2LjgtMzEuNyAxMi00OC4zIDE1LjQtNy44IDI0LjItMTkuNCA0Ny4xLTM0LjQgNjcuNy0xNC45IDIwLjYtMzMgMzguNy01My42IDUzLjYtMjAuNiAxNS00My40IDI2LjYtNjcuNiAzNC40LTI0LjIgNy45LTQ5LjUgMTEuOC03NSAxMS44LTE2LjkuMS0zMy45LTEuNy01MC41LTUuMS0xNi41LTMuNS0zMi43LTguOC00OC4yLTE1LjdzLTMwLjItMTUuNS00My45LTI1LjVjLTEzLjYtMTAtMjYuMi0yMS41LTM3LjQtMzQuMi0yNSA1LjQtNTAuNiA2LjctNzUuOSA0LjEtMjUuMy0yLjctNTAuMS05LjMtNzMuNC0xOS43LTIzLjItMTAuMy00NC43LTI0LjMtNjMuNi00MS40cy0zNS0zNy4xLTQ3LjctNTkuMWMtOC41LTE0LjctMTUuNS0zMC4yLTIwLjgtNDYuM3MtOC44LTMyLjctMTAuNi00OS42Yy0xLjgtMTYuOC0xLjctMzMuOC4xLTUwLjcgMS44LTE2LjggNS41LTMzLjQgMTAuOC00OS41LTE3LTE4LjktMzEtNDAuNC00MS40LTYzLjYtMTAuMy0yMy4zLTE3LTQ4LTE5LjYtNzMuMy0yLjctMjUuMy0xLjMtNTAuOSA0LTc1LjhzMTQuNS00OC44IDI3LjMtNzAuOGM4LjQtMTQuNyAxOC4zLTI4LjYgMjkuNi00MS4yczI0LTI0IDM3LjctMzQgMjguNS0xOC41IDQ0LTI1LjNjMTUuNi02LjkgMzEuOC0xMiA0OC40LTE1LjQgNy44LTI0LjMgMTkuNC00Ny4xIDM0LjMtNjcuNyAxNS0yMC42IDMzLjEtMzguNyA1My43LTUzLjcgMjAuNi0xNC45IDQzLjQtMjYuNSA2Ny42LTM0LjQgMjQuMi03LjggNDkuNS0xMS44IDc1LTExLjcgMTYuOS0uMSAzMy45IDEuNiA1MC41IDUuMXMzMi44IDguNyA0OC4zIDE1LjZjMTUuNSA3IDMwLjIgMTUuNSA0My45IDI1LjUgMTMuNyAxMC4xIDI2LjMgMjEuNSAzNy41IDM0LjIgMjQuOS01LjMgNTAuNS02LjYgNzUuOC00czUwIDkuMyA3My4zIDE5LjZjMjMuMiAxMC40IDQ0LjcgMjQuMyA2My42IDQxLjQgMTguOSAxNyAzNSAzNi45IDQ3LjcgNTkgOC41IDE0LjYgMTUuNSAzMC4xIDIwLjggNDYuMyA1LjMgMTYuMSA4LjkgMzIuNyAxMC42IDQ5LjYgMS44IDE2LjkgMS44IDMzLjktLjEgNTAuOC0xLjggMTYuOS01LjUgMzMuNS0xMC44IDQ5LjYgMTcuMSAxOC45IDMxIDQwLjMgNDEuNCA2My42em0tMzMzLjIgNDI2LjljMjEuOC05IDQxLjYtMjIuMyA1OC4zLTM5czMwLTM2LjUgMzktNTguNGM5LTIxLjggMTMuNy00NS4yIDEzLjctNjguOHYtMjIzcS0uMS0uMy0uMi0uNy0uMS0uMy0uMy0uNi0uMi0uMy0uNS0uNS0uMy0uMy0uNi0uNGwtODAuNy00Ni42djI2OS40YzAgMi43LS40IDUuNS0xLjEgOC4xLS43IDIuNy0xLjcgNS4yLTMuMSA3LjZzLTMgNC42LTUgNi41YTMyLjEgMzIuMSAwIDAgMSAtNi41IDVsLTE5MS4xIDExMC4zYy0xLjYgMS00LjMgMi40LTUuNyAzLjIgNy45IDYuNyAxNi41IDEyLjYgMjUuNSAxNy44IDkuMSA1LjIgMTguNSA5LjYgMjguMyAxMy4yIDkuOCAzLjUgMTkuOSA2LjIgMzAuMSA4IDEwLjMgMS44IDIwLjcgMi43IDMxLjEgMi43IDIzLjYgMCA0Ny00LjcgNjguOC0xMy44em0tNDU1LjEtMTUxLjRjMTEuOSAyMC41IDI3LjYgMzguMyA0Ni4zIDUyLjcgMTguOCAxNC40IDQwLjEgMjQuOSA2Mi45IDMxczQ2LjYgNy43IDcwIDQuNiA0NS45LTEwLjcgNjYuNC0yMi41bDE5My4yLTExMS41LjUtLjVxLjItLjIuMy0uNi4yLS4zLjMtLjZ2LTk0bC0yMzMuMiAxMzQuOWMtMi40IDEuNC00LjkgMi40LTcuNSAzLjItMi43LjctNS40IDEtOC4yIDEtMi43IDAtNS40LS4zLTguMS0xLTIuNi0uOC01LjItMS44LTcuNi0zLjJsLTE5MS4xLTExMC40Yy0xLjctMS00LjItMi41LTUuNi0zLjQtMS44IDEwLjMtMi43IDIwLjctMi43IDMxLjFzMSAyMC44IDIuOCAzMS4xYzEuOCAxMC4yIDQuNiAyMC4zIDguMSAzMC4xIDMuNiA5LjggOCAxOS4yIDEzLjIgMjguMnptLTUwLjItNDE3Yy0xMS44IDIwLjUtMTkuNCA0My4xLTIyLjUgNjYuNXMtMS41IDQ3LjEgNC42IDcwYzYuMSAyMi44IDE2LjYgNDQuMSAzMSA2Mi45IDE0LjQgMTguNyAzMi4zIDM0LjQgNTIuNyA0Ni4ybDE5My4xIDExMS42cS4zLjEuNy4yaC43cS40IDAgLjctLjIuMy0uMS42LS4zbDgxLTQ2LjgtMjMzLjItMTM0LjZjLTIuMy0xLjQtNC41LTMuMS02LjUtNWEzMi4xIDMyLjEgMCAwIDEgLTUtNi41Yy0xLjMtMi40LTIuNC00LjktMy4xLTcuNi0uNy0yLjYtMS4xLTUuMy0xLTguMXYtMjI3LjFjLTkuOCAzLjYtMTkuMyA4LTI4LjMgMTMuMi05IDUuMy0xNy41IDExLjMtMjUuNSAxOC03LjkgNi43LTE1LjMgMTQuMS0yMiAyMi4xLTYuNyA3LjktMTIuNiAxNi41LTE3LjggMjUuNXptNjYzLjMgMTU0LjRjMi40IDEuNCA0LjYgMyA2LjYgNSAxLjkgMS45IDMuNiA0LjEgNSA2LjUgMS4zIDIuNCAyLjQgNSAzLjEgNy42LjYgMi43IDEgNS40LjkgOC4ydjIyNy4xYzMyLjEtMTEuOCA2MC4xLTMyLjUgODAuOC01OS43IDIwLjgtMjcuMiAzMy4zLTU5LjcgMzYuMi05My43cy0zLjktNjguMi0xOS43LTk4LjUtMzkuOS01NS41LTY5LjUtNzIuNWwtMTkzLjEtMTExLjZxLS4zLS4xLS43LS4yaC0uN3EtLjMuMS0uNy4yLS4zLjEtLjYuM2wtODAuNiA0Ni42IDIzMy4yIDEzNC43em04MC41LTEyMWgtLjF2LjF6bS0uMS0uMWM1LjgtMzMuNiAxLjktNjguMi0xMS4zLTk5LjctMTMuMS0zMS41LTM1LTU4LjYtNjMtNzguMi0yOC0xOS41LTYxLTMwLjctOTUuMS0zMi4yLTM0LjItMS40LTY4IDYuOS05Ny42IDIzLjlsLTE5My4xIDExMS41cS0uMy4yLS41LjVsLS40LjZxLS4xLjMtLjIuNy0uMS4zLS4xLjd2OTMuMmwyMzMuMi0xMzQuN2MyLjQtMS40IDUtMi40IDcuNi0zLjIgMi43LS43IDUuNC0xIDguMS0xIDIuOCAwIDUuNS4zIDguMiAxIDIuNi44IDUuMSAxLjggNy41IDMuMmwxOTEuMSAxMTAuNGMxLjcgMSA0LjIgMi40IDUuNiAzLjN6bS01MDUuMy0xMDMuMmMwLTIuNy40LTUuNCAxLjEtOC4xLjctMi42IDEuNy01LjIgMy4xLTcuNiAxLjQtMi4zIDMtNC41IDUtNi41IDEuOS0xLjkgNC4xLTMuNiA2LjUtNC45bDE5MS4xLTExMC4zYzEuOC0xLjEgNC4zLTIuNSA1LjctMy4yLTI2LjItMjEuOS01OC4yLTM1LjktOTIuMS00MC4yLTMzLjktNC40LTY4LjMgMS05OS4yIDE1LjUtMzEgMTQuNS01Ny4yIDM3LjYtNzUuNSA2Ni40LTE4LjMgMjguOS0yOCA2Mi4zLTI4IDk2LjV2MjIzcS4xLjQuMi43LjEuMy4zLjYuMi4zLjUuNi4yLjIuNi40bDgwLjcgNDYuNnptNDMuOCAyOTQuNyAxMDMuOSA2MCAxMDMuOS02MHYtMTE5LjlsLTEwMy44LTYwLTEwMy45IDYweiIgLz4KPC9zdmc+Cg==',
    background: '#ffffff',
    scale: 0.7,
    shape: 'circle'
  };

  constructor(options: AnyObject) {
    super(options);

    logger.debug(`initialized with ${JSON.stringify(options, null, 2)}`);
  }

  public listModel(): Model[] {
    return [
      {
        name: 'example',
        displayName: 'Example Model'
      }
    ];
  }

  public async run(request: PromptRequest): Promise<Readable> {
    const { user, history, prompt } = request;
    const model = 'gpt-4o';

    const config = request.config;

    const stream = new PassThrough();

    const messages: any =
      history?.map((message: PromptRequestMessage) => ({
        role: message.role || 'developer',
        content: message.content
      })) || [];

    messages.push({
      role: 'user',
      content: prompt
    });

    try {
      const apiKey = config?.apikey || this.options?.apikey;
      if (!apiKey) throw new Error('API Key is missing or empty, please contact the administrator.');

      const openai = new OpenAI({
        apiKey
      });

      const abortController = new AbortController();
      const completion = await openai.chat.completions.create(
        {
          model,
          messages,
          user,
          store: false,
          stream: true,
          stream_options: { include_usage: true }
          // temperature: 1,
          // max_completion_tokens: 10 * 1024,
          // top_p: 1,
          // frequency_penalty: 0,
          // presence_penalty: 0
        },
        { signal: abortController.signal }
      );

      (async () => {
        let completionid = null;
        let result = '';
        let usage: AnswerUsage = { input: 0, output: 0, total: 0, raw: null };

        stream.on('abort', () => {
          abortController.abort();
        });

        for await (const chunk of completion) {
          if (!completionid) completionid = chunk.id;
          const text = chunk?.choices?.length ? chunk?.choices[0].delta?.content?.toString() : null;
          if (text) {
            stream.write(text);
            result += text;
          }

          // 이벤트에 토큰 사용량 정보가 포함되어 있는 경우 캡처
          if (chunk.usage) {
            usage.input = chunk.usage.prompt_tokens;
            usage.output = chunk.usage.completion_tokens;
            usage.total = chunk.usage.prompt_tokens + chunk.usage.completion_tokens;
            usage.raw = chunk.usage;
            stream.emit('usage', usage);
          }
        }

        const summurize = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes text within 30 characters. Answer within 30 characters at most, without breaking sentences in between.'
            },
            { role: 'user', content: `Summarize this conversation: ${result}` }
          ],
          max_tokens: 100
        });

        let summary = (summurize.choices[0].message.content || '').trim();
        if (summary.endsWith('.')) summary = summary.substring(0, summary.length - 2);

        stream.emit('complete', {
          id: completionid,
          result,
          annotations: null,
          usage,
          raw: {
            usage: usage.raw
          },
          summary
        } as RunResult);

        stream.end();
      })();
    } catch (err) {
      stream.emit('error', err);
    }

    return stream;
  }
}
