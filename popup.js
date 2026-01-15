// Load secrets on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadSecrets();
  
  // Form submission
  document.getElementById('secretForm').addEventListener('submit', handleAddSecret);
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  
  // Import button
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  
  // File input change
  document.getElementById('fileInput').addEventListener('change', handleFileImport);
});

// Load and display secrets
async function loadSecrets() {
  const result = await chrome.storage.local.get(['secrets']);
  const secrets = result.secrets || [];
  displaySecrets(secrets);
}

// Display secrets in the list
function displaySecrets(secrets) {
  const secretsList = document.getElementById('secretsList');
  
  if (secrets.length === 0) {
    secretsList.innerHTML = '<p class="empty-message">No secrets stored yet. Add one above!</p>';
    return;
  }
  
  // SVG icon templates
  const eyeIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const copyIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const editIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
  const deleteIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
  
  secretsList.innerHTML = secrets.map((secret, index) => {
    return '<div class="secret-item">' +
      '<div class="secret-header">' +
        '<div class="secret-title">' + escapeHtml(secret.title) + '</div>' +
        '<div class="secret-actions">' +
          '<button class="btn-icon toggle-visibility" data-index="' + index + '" title="Toggle visibility">' + eyeIcon + '</button>' +
          '<button class="btn-icon btn-copy" data-index="' + index + '" title="Copy secret">' + copyIcon + '</button>' +
          '<button class="btn-icon btn-edit" data-index="' + index + '" title="Edit">' + editIcon + '</button>' +
          '<button class="btn-icon btn-danger" data-index="' + index + '" title="Delete">' + deleteIcon + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="secret-value collapsed" id="secret-value-' + index + '">' + escapeHtml(secret.secret) + '</div>' +
    '</div>';
  }).join('');
  
  // Attach event listeners to all buttons
  attachEventListeners();
}

// Attach event listeners to secret action buttons
function attachEventListeners() {
  // Toggle visibility buttons
  document.querySelectorAll('.toggle-visibility').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('button').dataset.index);
      toggleVisibility(index);
    });
  });
  
  // Copy buttons
  document.querySelectorAll('.btn-copy').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('button').dataset.index);
      copySecret(index);
    });
  });
  
  // Edit buttons
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('button').dataset.index);
      editSecret(index);
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.btn-danger').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('button').dataset.index);
      deleteSecret(index);
    });
  });
}

// Toggle visibility of secret value (accordion style)
function toggleVisibility(index) {
  const secretValue = document.getElementById(`secret-value-${index}`);
  const button = document.querySelector(`.toggle-visibility[data-index="${index}"]`);
  
  if (secretValue) {
    const isCollapsed = secretValue.classList.contains('collapsed');
    
    if (isCollapsed) {
      // Expand
      secretValue.classList.remove('collapsed');
      secretValue.classList.add('expanded');
      if (button) {
        // Change icon to "eye-off" or keep it as eye but indicate it's visible
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      }
    } else {
      // Collapse
      secretValue.classList.remove('expanded');
      secretValue.classList.add('collapsed');
      if (button) {
        // Change icon back to regular eye
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      }
    }
  }
}

// Copy secret to clipboard
async function copySecret(index) {
  const result = await chrome.storage.local.get(['secrets']);
  const secrets = result.secrets || [];
  
  if (index >= 0 && index < secrets.length) {
    const secretValue = secrets[index].secret;
    const button = document.querySelector(`.btn-copy[data-index="${index}"]`);
    
    try {
      await navigator.clipboard.writeText(secretValue);
      
      // Visual feedback - temporarily change button icon
      if (button) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        button.style.background = '#10b981';
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.style.background = '';
        }, 1000);
      }
    } catch (err) {
      // Fallback for older browsers or when clipboard API fails
      const textArea = document.createElement('textarea');
      textArea.value = secretValue;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        const success = document.execCommand('copy');
        if (success && button) {
          const originalHTML = button.innerHTML;
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          button.style.background = '#10b981';
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
          }, 1000);
        } else {
          throw new Error('Copy command failed');
        }
      } catch (fallbackErr) {
        alert('Failed to copy secret. Please try again.');
      }
      document.body.removeChild(textArea);
    }
  }
}

// Handle form submission
async function handleAddSecret(e) {
  e.preventDefault();
  
  const titleInput = document.getElementById('titleInput');
  const secretInput = document.getElementById('secretInput');
  
  const title = titleInput.value.trim();
  const secret = secretInput.value.trim();
  
  if (!title || !secret) {
    return;
  }
  
  const result = await chrome.storage.local.get(['secrets']);
  const secrets = result.secrets || [];
  
  // Check if editing
  const editingIndex = parseInt(titleInput.dataset.editingIndex);
  if (!isNaN(editingIndex)) {
    secrets[editingIndex] = { title, secret };
    delete titleInput.dataset.editingIndex;
  } else {
    secrets.push({ title, secret });
  }
  
  await chrome.storage.local.set({ secrets });
  
  titleInput.value = '';
  secretInput.value = '';
  document.querySelector('.btn-primary').textContent = 'Add Secret';
  
  loadSecrets();
}

// Edit secret
async function editSecret(index) {
  const result = await chrome.storage.local.get(['secrets']);
  const secrets = result.secrets || [];
  
  if (index >= 0 && index < secrets.length) {
    const secret = secrets[index];
    document.getElementById('titleInput').value = secret.title;
    document.getElementById('secretInput').value = secret.secret;
    document.getElementById('titleInput').dataset.editingIndex = index;
    document.querySelector('.btn-primary').textContent = 'Update Secret';
    
    // Scroll to form
    document.querySelector('.secret-form').scrollIntoView({ behavior: 'smooth' });
  }
}

// Delete secret
async function deleteSecret(index) {
  if (!confirm('Are you sure you want to delete this secret?')) {
    return;
  }
  
  const result = await chrome.storage.local.get(['secrets']);
  const secrets = result.secrets || [];
  
  secrets.splice(index, 1);
  await chrome.storage.local.set({ secrets });
  
  loadSecrets();
}

// Export to CSV
async function exportToCSV() {
  const result = await chrome.storage.local.get(['secrets']);
  const secrets = result.secrets || [];
  
  if (secrets.length === 0) {
    alert('No secrets to export!');
    return;
  }
  
  // Create CSV content
  const headers = ['Title', 'Secret'];
  const rows = secrets.map(s => [
    escapeCSV(s.title),
    escapeCSV(s.secret)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `secrets-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Handle file import
function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const csv = event.target.result;
      const secrets = parseCSV(csv);
      
      if (secrets.length === 0) {
        alert('No valid secrets found in CSV file!');
        return;
      }
      
      // Get existing secrets
      const result = await chrome.storage.local.get(['secrets']);
      const existingSecrets = result.secrets || [];
      
      // Merge with existing (avoid duplicates by title)
      const existingTitles = new Set(existingSecrets.map(s => s.title));
      const newSecrets = secrets.filter(s => !existingTitles.has(s.title));
      
      if (newSecrets.length === 0) {
        alert('All secrets in the CSV already exist!');
        return;
      }
      
      const mergedSecrets = [...existingSecrets, ...newSecrets];
      await chrome.storage.local.set({ secrets: mergedSecrets });
      
      alert(`Successfully imported ${newSecrets.length} secret(s)!`);
      loadSecrets();
    } catch (error) {
      alert('Error importing CSV: ' + error.message);
    }
  };
  
  reader.readAsText(file);
  e.target.value = ''; // Reset file input
}

// Parse CSV content
function parseCSV(csv) {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return [];
  }
  
  // Skip header row
  const dataLines = lines.slice(1);
  const secrets = [];
  
  for (const line of dataLines) {
    const values = parseCSVLine(line);
    if (values.length >= 2 && values[0].trim() && values[1].trim()) {
      secrets.push({
        title: values[0].trim(),
        secret: values[1].trim()
      });
    }
  }
  
  return secrets;
}

// Parse a single CSV line (handles quoted values)
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escape CSV value (wrap in quotes if contains comma, quote, or newline)
function escapeCSV(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// Event listeners are attached via attachEventListeners() function
