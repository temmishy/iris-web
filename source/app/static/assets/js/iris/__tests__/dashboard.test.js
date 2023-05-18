describe('task_status', () => {
  it('should load task status information into modal', () => {
    // Mock the jQuery load function
    const loadMock = jest.fn((url, callback) => {
      callback('<div>Task status information</div>', 'success');
    });
    global.$ = jest.fn(() => ({
      load: loadMock,
      modal: jest.fn(),
    }));

    // Call the function with a mock ID
    task_status(123);

    // Expect the jQuery load function to have been called with the correct URL
    expect(loadMock).toHaveBeenCalledWith('tasks/status/human/123', expect.any(Function));

    // Expect the jQuery modal function to have been called
    expect(global.$().modal).toHaveBeenCalledWith({ show: true });
  });

  it('should handle errors when loading task status information', () => {
    // Mock the jQuery load function to return an error
    const loadMock = jest.fn((url, callback) => {
      callback(null, 'error');
    });
    global.$ = jest.fn(() => ({
      load: loadMock,
      modal: jest.fn(),
    }));

    // Call the function with a mock ID
    task_status(123);

    // Expect the jQuery load function to have been called with the correct URL
    expect(loadMock).toHaveBeenCalledWith('tasks/status/human/123', expect.any(Function));

    // Expect the ajax_notify_error function to have been called
    expect(ajax_notify_error).toHaveBeenCalled();

    // Expect the jQuery modal function not to have been called
    expect(global.$().modal).not.toHaveBeenCalled();
  });
});