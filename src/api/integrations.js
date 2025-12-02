

// Mocking integrations to prevent runtime errors during proxy refactor
const mockIntegration = {
  InvokeLLM: async () => { console.warn('Integrations not available via proxy yet'); },
  SendEmail: async () => { console.warn('Integrations not available via proxy yet'); },
  UploadFile: async () => { console.warn('Integrations not available via proxy yet'); },
  GenerateImage: async () => { console.warn('Integrations not available via proxy yet'); },
  ExtractDataFromUploadedFile: async () => { console.warn('Integrations not available via proxy yet'); },
  CreateFileSignedUrl: async () => { console.warn('Integrations not available via proxy yet'); },
  UploadPrivateFile: async () => { console.warn('Integrations not available via proxy yet'); }
};

export const Core = mockIntegration;

export const InvokeLLM = mockIntegration.InvokeLLM;

export const SendEmail = mockIntegration.SendEmail;

export const UploadFile = mockIntegration.UploadFile;

export const GenerateImage = mockIntegration.GenerateImage;

export const ExtractDataFromUploadedFile = mockIntegration.ExtractDataFromUploadedFile;

export const CreateFileSignedUrl = mockIntegration.CreateFileSignedUrl;

export const UploadPrivateFile = mockIntegration.UploadPrivateFile;
