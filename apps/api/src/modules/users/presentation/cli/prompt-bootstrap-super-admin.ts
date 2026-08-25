import { stdin, stdout } from 'node:process';
import {
  createInterface,
  type Interface as ReadlineInterface,
} from 'node:readline/promises';
import { Writable } from 'node:stream';

import {
  BootstrapSuperAdminInputError,
  type ValidatedBootstrapSuperAdminInput,
  validateBootstrapSuperAdminInput,
} from './bootstrap-super-admin.input';

class MutableTerminalOutput extends Writable {
  private muted = false;

  constructor(private readonly destination: NodeJS.WriteStream) {
    super();
  }

  mute(): void {
    this.muted = true;
  }

  unmute(): void {
    this.muted = false;
  }

  override _write(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    if (!this.muted) {
      this.destination.write(chunk, encoding);
    }

    callback();
  }
}

async function askHiddenQuestion(
  readline: ReadlineInterface,
  terminalOutput: MutableTerminalOutput,
  prompt: string,
  signal: AbortSignal,
): Promise<string> {
  stdout.write(prompt);
  terminalOutput.mute();

  try {
    return await readline.question('', { signal });
  } finally {
    terminalOutput.unmute();
    stdout.write('\n');
  }
}

export async function promptForBootstrapSuperAdmin(): Promise<ValidatedBootstrapSuperAdminInput> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new BootstrapSuperAdminInputError('此命令必须在交互式终端中运行。');
  }

  const terminalOutput = new MutableTerminalOutput(stdout);
  const readline = createInterface({
    input: stdin,
    output: terminalOutput,
    terminal: true,
  });
  const abortController = new AbortController();

  readline.once('SIGINT', () => {
    abortController.abort();
  });

  try {
    const email = await readline.question('邮箱：', {
      signal: abortController.signal,
    });
    const password = await askHiddenQuestion(
      readline,
      terminalOutput,
      '密码：',
      abortController.signal,
    );
    const passwordConfirmation = await askHiddenQuestion(
      readline,
      terminalOutput,
      '确认密码：',
      abortController.signal,
    );

    return validateBootstrapSuperAdminInput({
      email,
      password,
      passwordConfirmation,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BootstrapSuperAdminInputError('已取消操作。');
    }

    throw error;
  } finally {
    terminalOutput.unmute();
    readline.close();
  }
}
