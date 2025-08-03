import React, { useState } from 'react';
import { documentService } from '../../services/documentService';
import { PatientDocument } from '../../types';

interface DocumentManagerProps {
  patientId: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ patientId }) => {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = async () => {
    const results = await documentService.searchDocuments(patientId, searchTerm);
    setDocuments(results);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search documents..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      {/* Add document list and other UI elements here */}
    </div>
  );
};

export default DocumentManager;