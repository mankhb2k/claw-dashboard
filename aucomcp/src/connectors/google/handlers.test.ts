import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { driveToolSchemas } from './drive/handlers.js';
import { calendarToolSchemas } from './calendar/handlers.js';
import { errorResponse } from './lib/types.js';
import { escapeDriveQuery, getMimeTypeFromFilename } from './lib/drive-utils.js';
import { buildCalendarEventUpdate } from './lib/calendar-utils.js';

describe('drive tool schemas', () => {
  it('search requires query', () => {
    const result = driveToolSchemas.search.safeParse({});
    assert.equal(result.success, false);
  });

  it('uploadFile requires contentBase64', () => {
    const result = driveToolSchemas.uploadFile.safeParse({ name: 'test.txt' });
    assert.equal(result.success, false);
  });

  it('uploadFile accepts base64 content', () => {
    const result = driveToolSchemas.uploadFile.safeParse({
      contentBase64: Buffer.from('hello').toString('base64'),
      name: 'hello.txt',
    });
    assert.equal(result.success, true);
  });

  it('downloadFile defaults returnInline to true', () => {
    const result = driveToolSchemas.downloadFile.safeParse({ fileId: 'abc123' });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.returnInline, true);
    }
  });
});

describe('calendar tool schemas', () => {
  it('getCalendarEvent requires eventId', () => {
    const result = calendarToolSchemas.getCalendarEvent.safeParse({});
    assert.equal(result.success, false);
  });

  it('createCalendarEvent requires summary, start, end', () => {
    const result = calendarToolSchemas.createCalendarEvent.safeParse({
      summary: 'Meet',
      start: { dateTime: '2024-01-01T10:00:00Z' },
      end: { dateTime: '2024-01-01T11:00:00Z' },
    });
    assert.equal(result.success, true);
  });
});

describe('lib helpers', () => {
  it('escapeDriveQuery escapes quotes', () => {
    assert.equal(escapeDriveQuery("it's"), "it\\'s");
  });

  it('getMimeTypeFromFilename maps md to markdown', () => {
    assert.equal(getMimeTypeFromFilename('notes.md'), 'text/markdown');
  });

  it('errorResponse marks isError', () => {
    const r = errorResponse('fail');
    assert.equal(r.isError, true);
    assert.match(r.content[0].text, /fail/);
  });

  it('buildCalendarEventUpdate merges overrides', () => {
    const updated = buildCalendarEventUpdate(
      { summary: 'Old', description: 'Keep', start: { dateTime: 'a' }, end: { dateTime: 'b' } },
      { summary: 'New' },
    );
    assert.equal(updated.summary, 'New');
    assert.equal(updated.description, 'Keep');
  });
});
