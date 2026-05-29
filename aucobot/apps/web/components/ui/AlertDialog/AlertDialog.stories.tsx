import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog/AlertDialog';
import { Button } from '@/components/ui/Button/Button';

const meta: Meta<typeof AlertDialog> = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

const DemoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-subtle)',
    fontWeight: 600,
    marginBottom: '12px',
  }}>
    {children}
  </p>
);

const DemoBox = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '32px',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-white)',
    ...style,
  }}>
    {children}
  </div>
);

export const Default: StoryObj = {
  render: () => (
    <div>
      <DemoLabel>Click the button below to open the dialog:</DemoLabel>
      <DemoBox>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="primary">Open alert dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Your data will be permanently deleted from the server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DemoBox>
    </div>
  ),
};

export const Danger: StoryObj = {
  render: () => (
    <div>
      <DemoLabel>Dangerous action:</DemoLabel>
      <DemoBox style={{ borderColor: 'var(--color-danger-dim)' }}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="danger">Delete account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                All projects and related data will be deleted immediately. Make sure you have backed up anything important.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Let me think</AlertDialogCancel>
              <AlertDialogAction variant="danger">
                I understand, delete it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DemoBox>
    </div>
  ),
};
