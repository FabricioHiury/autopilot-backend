import axios from 'axios';
import { Readable } from 'stream';
import { downloadFileContentSafe } from './file-download.utils';

describe('Attachment downloads', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['image/png', 'image/png'],
    [undefined, 'application/octet-stream'],
    ['', 'application/octet-stream'],
    [123, 'application/octet-stream'],
    [true, 'application/octet-stream'],
    [['image/png'], 'application/octet-stream'],
  ])('returns a string MIME type for header %j', async (header, expected) => {
    const content = Buffer.from('attachment');
    jest.spyOn(axios, 'get').mockResolvedValue({
      headers: { 'content-type': header },
      data: Readable.from([content]),
    });

    await expect(
      downloadFileContentSafe('https://example.test/file'),
    ).resolves.toEqual({
      fileBuffer: content,
      mimeType: expected,
    });
  });
});
