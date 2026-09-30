# Student 4 Individual Assignment Package

Student: D. K. Yasan Lakmal Hemachandra  
Student ID: IT23827226  
Specialization: Student 4 Information Retrieval and Security Assessment

## Folder contents

- `01_Final_Submission` contains the student's edited DOCX report. This is the main submission document.
- `02_Assignment_Brief` contains the original individual assignment brief.
- `03_Evidence` contains the custom audit results and report figures.
- `04_Supporting_Project_Evidence` contains the retrieval evaluation report, responsible AI plan, and recorded retrieval metrics.
- `05_Audit_Tools` contains the reproducible Student 4 audit and report-generation scripts, together with the working report archive.
- `06_Backups_and_Rendered_QA` contains backup report versions, the rendered PDF, and page images used for visual quality assurance.

## Main submission file

`01_Final_Submission/Individual_Assignment_IT23827226_Student4.docx`

## Viva demonstration

From PowerShell, run:

`powershell -ExecutionPolicy Bypass -File .\Run_Student4_Viva_Demo.ps1`

For the audit plus the selected 33-test regression suite, run:

`powershell -ExecutionPolicy Bypass -File .\Run_Student4_Viva_Demo.ps1 -Full`

The audit uses the local FastAPI TestClient and deterministic demo data. It disables Supabase and OpenAI and updates `03_Evidence/student4_audit_results.json`.

The original files outside this package were left unchanged.
