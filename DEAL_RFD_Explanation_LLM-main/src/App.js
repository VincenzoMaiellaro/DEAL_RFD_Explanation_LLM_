import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Modal, Button,Table } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ReactComponent as TrashIcon } from 'bootstrap-icons/icons/trash3-fill.svg';
import { ReactComponent as SearchIcon } from 'bootstrap-icons/icons/search.svg';
import { ReactComponent as PinIcon } from 'bootstrap-icons/icons/pin-fill.svg';
import { ReactComponent as PencilIcon } from 'bootstrap-icons/icons/pencil-square.svg';
import { ReactComponent as MoonIcon } from 'bootstrap-icons/icons/moon-fill.svg';
import { ReactComponent as SunIcon } from 'bootstrap-icons/icons/brightness-high-fill.svg';
import { ReactComponent as UploadIcon } from 'bootstrap-icons/icons/upload.svg';
import { ReactComponent as GridIcon } from 'bootstrap-icons/icons/grid-fill.svg';
import { ReactComponent as ListIcon } from 'bootstrap-icons/icons/list-ul.svg';
import { DarkModeContext } from './DarkModeProvider';
import FileDetailsPage from './FileDetailsPage';
import './App.css';

const MySwal = withReactContent(Swal);


const UploadModal = ({
  showModal,
  handleCloseModal,
  handleUpload,
  setSelectedFile,
  selectedFile,
  newFileName,
  setNewFileName,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { darkMode } = useContext(DarkModeContext);


  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        setSelectedFile(file);
        setNewFileName(file.name.replace('.json', '')); 
      } else {
        MySwal.fire('Invalid File', 'Please upload a JSON file.', 'error');
      }
      e.dataTransfer.clearData();
    }
  };


  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/json') {
        setSelectedFile(file);
        setNewFileName(file.name.replace('.json', '')); 
      } else {
        MySwal.fire('Invalid File', 'Please upload a JSON file.', 'error');
      }
    }
  };

  return (
    <Modal show={showModal} onHide={handleCloseModal} centered className={darkMode ? 'dark-modal' : ''}>
      <Modal.Header closeButton>
        <Modal.Title>Upload a File</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <UploadIcon className="upload-icon" />
          <p>Drag and drop a JSON file here, or click to select a file</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".json"
          />
        </div>
        {selectedFile && (
          <div className="mt-3">
            <p>
              Selected File: <strong>{selectedFile.name}</strong>
            </p>
            <label htmlFor="new-file-name">New File Name:</label>
            <input
              type="text"
              id="new-file-name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter new file name"
              className="form-control mt-2"
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={handleCloseModal}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={!selectedFile || !newFileName.trim()}
          className="upload-button"
        >
          Upload File
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

function App() {
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);

  const [selectedFile, setSelectedFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFileNameId, setSelectedFileNameId] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedFiles, setPinnedFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(12);
  const [sortOption, setSortOption] = useState({ criterion: 'date', order: 'desc' });

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? 'var(--background-color-dark)' : 'var(--background-color-light)';
    document.body.style.color = darkMode ? 'var(--text-color-dark)' : 'var(--text-color-light)';
    
    axios
      .get('http://localhost:5000/files')
      .then((response) => {
        setFiles(response.data);
      })
      .catch((error) => {
        console.error(error);
        MySwal.fire('Error', 'Failed to retrieve file names.', 'error');
      });
  }, [darkMode]);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setNewFileName('');
  };
  const handleShowModal = () => setShowModal(true);

  const handleUpload = async () => {
    if (!selectedFile || !newFileName.trim()) {
      MySwal.fire('Warning', 'Please select a file and enter a new file name.', 'warning');
      return;
    }

    let fileNameToUpload = newFileName.trim();

    if (!fileNameToUpload.endsWith('.json')) {
      fileNameToUpload += '.json';
    }

    const fileExists = files.some(
      (file) => file.fileName.toLowerCase() === fileNameToUpload.toLowerCase()
    );

    if (fileExists) {
      const { isConfirmed } = await MySwal.fire({
        title: 'File Name Exists',
        text: `A file named "${fileNameToUpload}" already exists. Do you want to overwrite it?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, overwrite',
        cancelButtonText: 'No, choose another name',
      });

      if (!isConfirmed) {
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', selectedFile, fileNameToUpload);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      MySwal.fire('Success', response.data.message || 'File uploaded successfully!', 'success');
      const filesResponse = await axios.get('http://localhost:5000/files');
      setFiles(filesResponse.data);
      handleCloseModal();
    } catch (error) {
      console.error(error);
      MySwal.fire('Error', 'Failed to upload the JSON file.', 'error');
    }
  };

  const handleEditFileName = async (fileId, currentFileName) => {
    const { value: newName } = await MySwal.fire({
      title: 'Enter New File Name',
      input: 'text',
      inputLabel: 'File Name',
      inputValue: currentFileName,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'File name cannot be empty!';
        }
        return null;
      },
    });

    if (newName) {
      let updatedName = newName.trim();

      if (updatedName === '.json') {
        MySwal.fire('Error', 'File name cannot be just ".json".', 'error');
        return;
      }

      if (!updatedName.toLowerCase().endsWith('.json')) {
        updatedName += '.json';
      }

      try {
        const existingFileNames = files.map((file) => file.fileName.toLowerCase());
        if (existingFileNames.includes(updatedName.toLowerCase())) {
          MySwal.fire(
            'Error',
            `The file name "${updatedName}" already exists. Please choose a different name.`,
            'error'
          );
          return;
        }

        const putResponse = await axios.put(`http://localhost:5000/files/${fileId}`, {
          fileName: updatedName,
        });

        MySwal.fire('Success', putResponse.data.message || 'File name updated successfully!', 'success');
        const updatedFiles = files.map((file) =>
          file._id === fileId ? { ...file, fileName: updatedName } : file
        );
        setFiles(updatedFiles);
      } catch (error) {
        console.error(error);
        MySwal.fire('Error', 'Failed to update the file name.', 'error');
      }
    }
  };

  const handleDelete = (fileId, event) => {
    event.stopPropagation(); 

    MySwal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this file?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`http://localhost:5000/files/${fileId}`)
          .then((response) => {
            MySwal.fire('Deleted!', response.data.message || 'File has been deleted.', 'success');
            setFiles(files.filter((file) => file._id !== fileId));
            setPinnedFiles(pinnedFiles.filter((id) => id !== fileId));
          })
          .catch((error) => {
            console.error(error);
            MySwal.fire('Error', 'Failed to delete the file.', 'error');
          });
      }
    });
  };

  const handlePinToggle = (fileId, event) => {
    event.stopPropagation();

    if (pinnedFiles.includes(fileId)) {
      setPinnedFiles(pinnedFiles.filter((id) => id !== fileId));
    } else {
      setPinnedFiles([...pinnedFiles, fileId]);
    }
  };

  const handleFileNameClick = (fileId) => {
    setSelectedFileNameId(fileId);
  };

  const handleBack = () => {
    setSelectedFileNameId(null);
  };

  const sortedFiles = [...files].sort((a, b) => {
    const isAPinned = pinnedFiles.includes(a._id);
    const isBPinned = pinnedFiles.includes(b._id);
  
    if (isAPinned && !isBPinned) {
      return -1;
    } else if (!isAPinned && isBPinned) {
      return 1; 
    } else {
      if (sortOption.criterion === 'date') {
        return sortOption.order === 'asc'
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortOption.criterion === 'name') {
        return sortOption.order === 'asc'
          ? a.fileName.localeCompare(b.fileName)
          : b.fileName.localeCompare(a.fileName);
      }
    }
  });
  
  const filteredFiles = sortedFiles.filter((file) =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
    setCurrentPage(1);
  };

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  const toggleSortOrder = (criterion) => {
    setSortOption((prevSortOption) => {
      if (prevSortOption.criterion === criterion) {
        return {
          ...prevSortOption,
          order: prevSortOption.order === 'asc' ? 'desc' : 'asc',
        };
      } else {
        return {
          criterion,
          order: 'asc',
        };
      }
    });
  };
  

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      {!selectedFileNameId && (
        <>
          <section className="wrapper">
            <div className="top">D.E.A.L.</div>
            <div className="bottom" aria-hidden="true">D.E.A.L.</div>
          </section>

          <section className="wrapper2">
            <div className="top2">Dependencies Explanation with Advanced Language Models</div>
          </section>

          <div className="search-section d-flex align-items-center">
            <input
              type="text"
              placeholder="Search by file name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
            <SearchIcon className="search-icon" />
            <Button variant="primary" onClick={handleShowModal} className="mt-3 upload-button">
             Upload File
            </Button>
          </div>
          <div className="sort-section">
          
            <button className="view-toggle-button" onClick={toggleViewMode}>
              {viewMode === 'grid' ? <ListIcon /> : <GridIcon />}
            </button>
        
            <div className="sort-label">
              <label>Sort by:</label>
            </div>
            <div className="sort-options">
              <button
                className={`sort-button ${sortOption.criterion === 'date' ? 'active' : ''}`}
                onClick={() => toggleSortOrder('date')}
              >
                <i className={`fas fa-sort-${sortOption.criterion === 'date' && sortOption.order === 'asc' ? 'numeric-up' : 'numeric-down'}`}></i>
                Date {sortOption.criterion === 'date' && (sortOption.order === 'asc' ? 'Asc' : 'Desc')}
              </button>
              <button
                className={`sort-button ${sortOption.criterion === 'name' ? 'active' : ''}`}
                onClick={() => toggleSortOrder('name')}
              >
                <i className={`fas fa-sort-alpha-${sortOption.criterion === 'name' && sortOption.order === 'asc' ? 'up' : 'down'}`}></i>
                Name {sortOption.criterion === 'name' && (sortOption.order === 'asc' ? 'Asc' : 'Desc')}
              </button>
            </div>
          </div>
        </>
      )}
      {!selectedFileNameId ? (
        viewMode === 'grid' ? (
          <div>
            <div className="file-container">
              {currentFiles.map((file, index) => (
                <div
                  key={file._id}
                  className={`desktop-icon ${file._id}`}
                  onClick={() => handleFileNameClick(file._id)}
                >
                  <i className="fas fa-file"></i>
                  <p className="file-name" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <button className="remove-btn" onClick={(event) => handleDelete(file._id, event)}>
                    <TrashIcon />
                  </button>
                  <button className="pin-btn" onClick={(event) => handlePinToggle(file._id, event)}>
                    <PinIcon className={`pin-icon ${pinnedFiles.includes(file._id) ? 'pinned' : ''}`} />
                  </button>
                  <button
                    className="edit-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditFileName(file._id, file.fileName, event);
                    }}
                  >
                     <PencilIcon style={{ fill: darkMode ? 'white' : 'black' }} /> 
                  </button>
                  <p className="timestamp">{new Date(file.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="pagination-container">
              <div className="pagination-bar">
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="pagination-button"
                >
                  {'<'}
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`pagination-button ${currentPage === index + 1 ? 'current-page' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="pagination-button"
                >
                  {'>'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Table striped bordered hover variant={darkMode ? 'dark' : 'light'}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map((file) => (
                  <tr key={file._id}>
                    <td onClick={() => handleFileNameClick(file._id)} className="file-link">
                      {file.fileName}
                    </td>
                    <td>{new Date(file.timestamp).toLocaleString()}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleFileNameClick(file._id)}
                        className="action-btn"
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={(event) => handleEditFileName(file._id, file.fileName, event)}
                        className="action-btn"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(event) => handleDelete(file._id, event)}
                        className="action-btn"
                      >
                        Delete
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={(event) => handlePinToggle(file._id, event)}
                        className={`action-btn ${pinnedFiles.includes(file._id) ? 'pinned' : ''}`}
                      >
                        {pinnedFiles.includes(file._id) ? 'Unpin' : 'Pin'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="pagination-container">
              <div className="pagination-bar">
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="pagination-button"
                >
                  {'<'}
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`pagination-button ${currentPage === index + 1 ? 'current-page' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="pagination-button"
                >
                  {'>'}
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <FileDetailsPage fileName={selectedFileNameId} onBack={handleBack} />
      )}

      <UploadModal
        showModal={showModal}
        handleCloseModal={handleCloseModal}
        handleUpload={handleUpload}
        setSelectedFile={setSelectedFile}
        selectedFile={selectedFile}
        newFileName={newFileName}
        setNewFileName={setNewFileName}
      />

<div className="toggle-button" onClick={toggleDarkMode}>
        <SunIcon className="sun" style={{ fill: darkMode ? 'white' : 'var(--text-color-light)' }} />
        <MoonIcon className="moon" />
        <div className="toggle"></div>
        <div className="animateBg"></div>
      </div>
    </div>
  );
}

export default App;
