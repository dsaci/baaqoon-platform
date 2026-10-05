const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/DistributionAdminPage.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /class ErrorBoundary extends React\.Component \{[\s\S]*?super\(props\);/;
const replacement = `interface ErrorBoundaryProps { children: React.ReactNode }
interface ErrorBoundaryState { hasError: boolean; error: any }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(path, code);
    console.log('Fixed ErrorBoundary types');
} else {
    console.log('Regex did not match');
}
